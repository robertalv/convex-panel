use function_runner::{FunctionRunner, FunctionMetadata};
use udf::validation::ValidatedPathAndArgs;

// Direct function runner usage (internal)
async fn call_function_runner<RT: Runtime>(
    function_runner: &dyn FunctionRunner<RT>,
    udf_type: UdfType,
    identity: Identity,
    ts: RepeatableTimestamp,
) -> anyhow::Result<FunctionOutcome> {
    let (tx, outcome, stats) = function_runner.run_function(
        udf_type,
        identity,
        ts,
        FunctionWrites::default(),
        None, // log_line_sender
        Some(FunctionMetadata {
            path_and_args: validated_path_and_args,
            journal: QueryJournal::new(),
        }),
        None, // http_action_metadata
        default_system_env_vars,
        BTreeMap::new(), // in_memory_index_last_modified
        ExecutionContext::new_for_request_id(request_id),
    ).await?;
    
    Ok(outcome)
}