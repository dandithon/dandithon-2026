export const chargeAmount=100_000;
export function confirmedBalance(user){
  if(!Number.isSafeInteger(user?.balance)||user.balance<0)throw Error('서버 잔액을 확인할 수 없어요. 현재 잔액을 다시 확인해 주세요.');
  return user.balance;
}
export function validateCharge(amount){
  if(!Number.isSafeInteger(amount)||amount<=0||amount>10_000_000)throw Error('충전 금액은 1~10,000,000 코인이어야 해요.');
  return amount;
}
