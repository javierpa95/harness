/**
 * Delegation wrapper over the pi-subagents RPC API (v0.42.1).
 *
 * pi-subagents exposes an in-process RPC bridge for other extensions. The
 * channel names and envelope shapes below are its documented public contract
 * (see node_modules/pi-subagents/src/extension/rpc.ts and the package's
 * "Extension RPC" documentation).
 *
 *   request  : subagents:rpc:v1:request
 *   reply    : subagents:rpc:v1:reply:<requestId>
 *   ready    : subagents:rpc:v1:ready
 *   asyncDone: subagent:async-complete
 *
 * Request envelope:  { version: 1, requestId, method, params?, source? }
 * Reply envelope:    { version: 1, requestId, method?, success, data | error }
 * Methods: ping, status, spawn, steer, interrupt, stop, resume.
 *
 * `spawn` is detached/async-only: it starts a background child session and
 * replies immediately with { text, details } where details carries the async
 * run id (`details.asyncId`). Completion is observed via the
 * `subagent:async-complete` event (payload carries `id`, `runId`, `success`,
 * `state`, `results`).
 *
 * NOTE on status polling: the `status` RPC returns `Details`, which has no
 * terminal `state`/`status` field (verified in pi-subagents
 * src/shared/types.ts, Details interface). A polling fallback that reads
 * those fields would be dead code, so completion relies exclusively on the
 * `subagent:async-complete` event. If the event is ever missed the run times
 * out after `timeoutMs` instead of hanging forever.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { randomUUID } from "node:crypto";

export const SUBAGENT_RPC_REQUEST_EVENT = "subagents:rpc:v1:request";
export const SUBAGENT_RPC_REPLY_PREFIX = "subagents:rpc:v1:reply:";
export const SUBAGENT_RPC_READY_EVENT = "subagents:rpc:v1:ready";
export const SUBAGENT_ASYNC_COMPLETE_EVENT = "subagent:async-complete";

export const SUBAGENT_RPC_VERSION = 1;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_RUN_TIMEOUT_MS = 30 * 60_000; // 30 min, mirrors pi-subagents foreground default

export type RpcMethod = "ping" | "status" | "spawn" | "steer" | "interrupt" | "stop" | "resume";

export interface RpcRequestEnvelope {
	version: 1;
	requestId: string;
	method: RpcMethod;
	params?: unknown;
	source?: { extension: string; [key: string]: unknown };
}

export interface RpcReplyEnvelope<T = unknown> {
	version: 1;
	requestId: string;
	method?: RpcMethod;
	success: boolean;
	data?: T;
	error?: { code: string; message: string };
}

export interface SpawnParams {
	agent: string;
	task: string;
	cwd?: string;
	timeoutMs?: number;
	context?: "fresh" | "fork";
	output?: string;
	outputMode?: "inline" | "file-only";
	turnBudget?: { maxTurns: number; graceTurns?: number };
}

/** Data payload of a successful RPC reply (dataFromToolResult in pi-subagents). */
export interface RpcResultData {
	text?: string;
	details?: Record<string, unknown> & { asyncId?: string; runId?: string; asyncDir?: string };
	isError?: boolean;
}

/** Payload of the subagent:async-complete event. */
export interface AsyncCompletionEvent {
	id?: string;
	runId?: string;
	agent?: string;
	mode?: string;
	success?: boolean;
	state?: string;
	status?: string;
	summary?: string;
	output?: string;
	error?: string;
	results?: Array<Record<string, unknown>>;
	sessionId?: string;
	[key: string]: unknown;
}

export interface DelegationResult {
	runId: string;
	agent: string;
	success: boolean;
	state: string;
	summary?: string;
	output?: string;
	error?: string;
}

export class SubagentDelegationError extends Error {
	readonly code: string;
	constructor(code: string, message: string) {
		super(message);
		this.name = "SubagentDelegationError";
		this.code = code;
	}
}

export interface SubagentsClientOptions {
	/** RPC request timeout before declaring the bridge unavailable. */
	requestTimeoutMs?: number;
	/** Default cap for a single delegated run. */
	defaultRunTimeoutMs?: number;
}

/**
 * Thin client over pi-subagents' in-process RPC bridge. Use `pi.events` from
 * the extension factory to construct one instance per session.
 */
export class SubagentsClient {
	private readonly events: ExtensionAPI["events"];
	private readonly requestTimeoutMs: number;
	private readonly defaultRunTimeoutMs: number;

	constructor(pi: ExtensionAPI, options: SubagentsClientOptions = {}) {
		this.events = pi.events;
		this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
		this.defaultRunTimeoutMs = options.defaultRunTimeoutMs ?? DEFAULT_RUN_TIMEOUT_MS;
	}

	/** Send an RPC request and await the reply envelope. */
	request<T = unknown>(method: RpcMethod, params?: unknown, timeoutMs?: number): Promise<T> {
		const requestId = randomUUID();
		const channel = `${SUBAGENT_RPC_REPLY_PREFIX}${requestId}`;
		return new Promise<T>((resolve, reject) => {
			let settled = false;
			const timer = setTimeout(() => {
				if (settled) return;
				settled = true;
				off();
				reject(new SubagentDelegationError("timeout", `RPC ${method} timed out after ${timeoutMs ?? this.requestTimeoutMs}ms (is pi-subagents installed and loaded?).`));
			}, timeoutMs ?? this.requestTimeoutMs);
			const off = this.events.on(channel, (raw: unknown) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				off();
				const reply = raw as RpcReplyEnvelope<T>;
				if (reply?.success) {
					resolve(reply.data as T);
				} else {
					reject(new SubagentDelegationError(reply?.error?.code ?? "rpc_error", reply?.error?.message ?? "Unknown subagent RPC error."));
				}
			});
			const envelope: RpcRequestEnvelope = {
				version: 1,
				requestId,
				method,
				...(params !== undefined ? { params } : {}),
				source: { extension: "sdd-orchestrator" },
			};
			this.events.emit(SUBAGENT_RPC_REQUEST_EVENT, envelope);
		});
	}

	/** Probe the bridge; throws if pi-subagents is not loaded. */
	async ping(): Promise<{ version: number; methods: string[]; session?: unknown }> {
		return this.request<{ version: number; methods: string[]; session?: unknown }>("ping", {}, 5_000);
	}

	/** Delegate one task to a subagent and wait for its completion. */
	async delegate(params: SpawnParams, runTimeoutMs?: number): Promise<DelegationResult> {
		await this.ping();
		const timeoutMs = params.timeoutMs ?? runTimeoutMs ?? this.defaultRunTimeoutMs;

		// Subscribe BEFORE emitting spawn so a fast child completion is not missed.
		const completionPromise = this.waitForAsyncCompletion(timeoutMs);

		try {
			const reply = await this.request<RpcResultData>("spawn", {
				agent: params.agent,
				task: params.task,
				async: true,
				clarify: false,
				...(params.cwd !== undefined ? { cwd: params.cwd } : {}),
				...(params.timeoutMs !== undefined ? { timeoutMs: params.timeoutMs } : {}),
				...(params.context !== undefined ? { context: params.context } : {}),
				...(params.output !== undefined ? { output: params.output } : {}),
				...(params.outputMode !== undefined ? { outputMode: params.outputMode } : {}),
				...(params.turnBudget !== undefined ? { turnBudget: params.turnBudget } : {}),
			});

			if (reply?.isError) {
				completionPromise.cancel();
				throw new SubagentDelegationError("spawn_failed", reply.text ?? "Subagent spawn failed.");
			}

			const asyncId = extractAsyncId(reply);
			if (!asyncId) {
				// The spawn reply normally carries details.asyncId. If it is missing
				// we cannot correlate completion; return what we have with a warning.
				completionPromise.cancel();
				return {
					runId: "unknown",
					agent: params.agent,
					success: false,
					state: "unknown",
					output: reply.text,
					error: "Spawn reply did not include an async run id; completion could not be observed.",
				};
			}

			return completionPromise.await(asyncId);
		} catch (error) {
			// RPC error or timeout: do not leak the completion timer/waiter.
			completionPromise.cancel();
			throw error;
		}
	}

	/** Query the status of a run by id. */
	async status(id: string): Promise<RpcResultData> {
		return this.request<RpcResultData>("status", { id });
	}

	/** Stop a running async run by id. */
	async stop(id: string): Promise<RpcResultData> {
		return this.request<RpcResultData>("stop", { id });
	}

	/** Register an on-close handler for every completed async run. */
	onTerminal(handler: (result: DelegationResult) => void): () => void {
		return this.events.on(SUBAGENT_ASYNC_COMPLETE_EVENT, (raw: unknown) => {
			const payload = raw as AsyncCompletionEvent;
			if (typeof payload?.id !== "string" && typeof payload?.runId !== "string") return;
			handler(toDelegationResult(payload));
		});
	}

	/**
	 * Create a completion waiter for one run. The waiter is bound to an async
	 * id after the spawn reply arrives (`await`). If cancel() fires before
	 * anyone awaits (spawn failure, missing async id), the internal promise is
	 * rejected but immediately neutralized via `.catch(() => {})` so it can
	 * never surface as an unhandled rejection.
	 */
	private waitForAsyncCompletion(timeoutMs: number): {
		await: (asyncId: string) => Promise<DelegationResult>;
		cancel: () => void;
	} {
		let resolveFn: ((r: DelegationResult) => void) | undefined;
		let rejectFn: ((e: Error) => void) | undefined;
		let unsubscribe: (() => void) | undefined;
		let done = false;
		let awaitedId: string | undefined;
		let lastPayload: AsyncCompletionEvent | undefined;

		const timer = setTimeout(() => {
			if (done) return;
			done = true;
			unsubscribe?.();
			rejectFn?.(new SubagentDelegationError("timeout", `Subagent run did not complete within ${timeoutMs}ms.`));
		}, timeoutMs);

		const promise = new Promise<DelegationResult>((resolve, reject) => {
			resolveFn = resolve;
			rejectFn = reject;
			unsubscribe = this.events.on(SUBAGENT_ASYNC_COMPLETE_EVENT, (raw: unknown) => {
				if (done) return;
				const payload = raw as AsyncCompletionEvent;
				lastPayload = payload;
				const id = payload?.id ?? payload?.runId;
				if (awaitedId !== undefined && id === awaitedId) {
					done = true;
					clearTimeout(timer);
					unsubscribe?.();
					resolve(toDelegationResult(payload));
				}
			});
		});
		// M2: neutralize the internal promise so a cancel()/timeout that fires
		// before anyone awaits never becomes an unhandled rejection (Node >= 15).
		promise.catch(() => { /* neutralized */ });

		const cancel = (): void => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			unsubscribe?.();
			rejectFn?.(new SubagentDelegationError("cancelled", "Completion wait cancelled."));
		};

		const awaitCompletion = (asyncId: string): Promise<DelegationResult> => {
			awaitedId = asyncId;
			if (done) return promise;
			// If completion already arrived before await() bound the id,
			// resolve from the stored payload.
			const id = lastPayload?.id ?? lastPayload?.runId;
			if (id === asyncId) {
				done = true;
				clearTimeout(timer);
				unsubscribe?.();
				resolveFn?.(toDelegationResult(lastPayload!));
			}
			return promise;
		};

		return { await: awaitCompletion, cancel };
	}
}

/** Extract the async run id from a spawn reply. */
function extractAsyncId(reply: RpcResultData | undefined): string | undefined {
	const details = reply?.details;
	if (typeof details?.asyncId === "string" && details.asyncId) return details.asyncId;
	if (typeof details?.runId === "string" && details.runId) return details.runId;
	const text = reply?.text ?? "";
	const match = text.match(/async run\s+([0-9a-fA-F-]{4,})/i) ?? text.match(/\b([0-9a-f]{8})\b/i);
	return match?.[1];
}

/** Map an async-complete payload to a DelegationResult. */
function toDelegationResult(payload: AsyncCompletionEvent): DelegationResult {
	const success = (payload.success ?? false) || payload.state === "complete" || payload.state === "completed";
	return {
		runId: (payload.id ?? payload.runId ?? "unknown").toString(),
		agent: typeof payload.agent === "string" ? payload.agent : "unknown",
		success: Boolean(success),
		state: typeof payload.state === "string" ? payload.state : typeof payload.status === "string" ? payload.status : "unknown",
		summary: payload.summary,
		output: payload.output,
		error: payload.error,
	};
}
