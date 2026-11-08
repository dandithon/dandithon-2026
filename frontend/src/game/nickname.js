export function validNickname(value){const name=value.trim();return [...name].length>=1&&[...name].length<=8&&!/[\u0000-\u001f\u007f-\u009f]/u.test(name);}
