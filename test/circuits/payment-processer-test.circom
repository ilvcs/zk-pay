pragma circom 2.1.6;

include "../../circuits/payment-processer.circom";

component main {public [userID, views, userOldTxNonce, oldRoot ]} = PaymentProcesser(10);