// Coalesce high-frequency pointer input into one visual update per frame.
export function createFrameTask(request,cancel){
  let frame=null,latest=null;
  const run=()=>{frame=null;const task=latest;latest=null;task?.();};
  return {
    schedule(task){latest=task;if(frame===null)frame=request(run);},
    flush(){if(frame!==null)cancel(frame);frame=null;const task=latest;latest=null;task?.();},
    cancel(){if(frame!==null)cancel(frame);frame=null;latest=null;},
  };
}
