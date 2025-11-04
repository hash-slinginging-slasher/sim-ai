/**
 * OpenTelemetry Instrumentation Entry Point
 *
 * This is the main entry point for OpenTelemetry instrumentation.
 * It delegates to runtime-specific instrumentation modules.
 */
export async function register() {
  console.log('[Instrumentation] register() called, NEXT_RUNTIME:', process.env.NEXT_RUNTIME)

  // Load Node.js-specific instrumentation
  // In production standalone mode, NEXT_RUNTIME may not be set, so load by default if not edge/client
  if (process.env.NEXT_RUNTIME === 'nodejs' || (!process.env.NEXT_RUNTIME && typeof window === 'undefined')) {
    console.log('[Instrumentation] Loading Node.js instrumentation...')
    const nodeInstrumentation = await import('./instrumentation-node')
    if (nodeInstrumentation.register) {
      await nodeInstrumentation.register()
    }
  }

  // Load Edge Runtime-specific instrumentation
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('[Instrumentation] Loading Edge instrumentation...')
    const edgeInstrumentation = await import('./instrumentation-edge')
    if (edgeInstrumentation.register) {
      await edgeInstrumentation.register()
    }
  }

  // Load client instrumentation if we're on the client
  if (typeof window !== 'undefined') {
    console.log('[Instrumentation] Loading client instrumentation...')
    await import('./instrumentation-client')
  }
}
