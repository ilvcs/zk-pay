#!/user/bin/env bash

# use `node --max-old-space-size=8192 node_modules/.bin/snarkjs` if the process dies because of out of memory

mkdir -p build
wget -nc https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau -P ./build
# [ ! -f ./build/payment-amount-verifyer.r1cs ] && circom circuits/payment-amount-verifyer.circom --wasm --r1cs -o ./build
# [ ! -f ./build/payment-amount-verifyer.zkey ] && npx snarkjs groth16 setup build/payment-amount-verifyer.r1cs build/powersOfTau28_hez_final_15.ptau build/payment-amount-verifyer.zkey
# [ ! -f ./build/payment-amount-verifyer_vkey.json ] && npx snarkjs zkey export verificationkey build/payment-amount-verifyer.zkey build/payment-amount-verifyer_vkey.json
[ ! -f ./build/payment-amount-verify-test.r1cs ] && circom test/circuits/payment-amount-verify-test.circom --wasm --r1cs -o ./build
[ ! -f ./build/payment-amount-verify-test.zkey ] && npx snarkjs groth16 setup build/payment-amount-verify-test.r1cs build/powersOfTau28_hez_final_15.ptau build/payment-amount-verify-test.zkey
[ ! -f ./build/payment-amount-verify-test_vkey.json ] && npx snarkjs zkey export verificationkey build/payment-amount-verify-test.zkey build/payment-amount-verify-test_vkey.json
[ ! -f ./build/payment-processer-test.r1cs ] && circom test/circuits/payment-processer-test.circom --wasm --r1cs -o ./build
[ ! -f ./build/payment-processer-test.zkey ] && npx snarkjs groth16 setup build/payment-processer-test.r1cs build/powersOfTau28_hez_final_15.ptau build/payment-processer-test.zkey
[ ! -f ./build/payment-processer-test_vkey.json ] && npx snarkjs zkey export verificationkey build/payment-processer-test.zkey build/payment-processer-test_vkey.json
exit 0