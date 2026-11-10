export function hasClaimableQuest(state){
  return Object.values(state.quests??{}).some(tasks=>tasks.some(task=>task.status==='COMPLETED'&&!(state.claimed??[]).includes(task.id)));
}
