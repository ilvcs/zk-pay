/**
 * @fileoverview test.js
 * @description This file contains the tests for the application.
 * TODO: 1. Create a circute that can accept userID and views as public inputs and SECRET as private input.
 * and return the result of the computation.
 * Result = (views * SECRET)/1000
 */

// Initialize the userBalance Trie with the initial balance "0" for all the users.
// For the simplicity of the test, we are using userIDs as the keys and their balance as the value.
// Ex: 1: 0, 2: 0, 3: 0, 4: 0, 5: 0

// Each User will have a mapping of their id and root of the merkle tree.
// mapping (userID => root);
// mapping (userID => nonce);
// SMT will be used to verify the root and nonce of the user.
// For balance SMT =  userNonce  => userBalance with creation proof
// Event(userID, root, nonce, timestamp) will be emitted when the user is registered.
const { newMemEmptyTrie, buildPoseidon } = require("circomlibjs");
const { assert } = require("chai");
const { wasm } = require("circom_tester");
const path = require("path");
const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const { BigNumber } = require("@ethersproject/bignumber");
const Logger = require("logplease");

const fs = require("fs");

const logger = Logger.create("test-zk-evm", { color: Logger.Colors.Yellow });
Logger.setLogLevel(Logger.LogLevels.DEBUG);

// For storing users previous txn hash;
let oldTxHashMapping = {};
let userNonceMapping = {};

describe("Anonimus Payment Verifier", function () {
	// Create few users with IDs
	let userIDs;
	let userStateTrie;
	let poseidon;

	let PaymentAmountVerifier;
	let PaymentProcessor;

	const convertSiblings = (siblings) => {
		let result = [];
		for (let i = 0; i < siblings.length; i++)
			result.push(userStateTrie.F.toObject(siblings[i]));
		while (result.length < 10) result.push(0);
		return result;
	};

	const calculatePaymentAmount = (views, secret) => {
		return (views * secret) / 1000;
	};

	const createPaymentTransferRequest = async (
		userID,
		views,
		secret,
		userOldTxNonce,
		oldTxHash,
	) => {
		// console.log(userID, views, secret, userNonce);
		const paymentAmount = calculatePaymentAmount(views, secret);
		const oldRoot = userStateTrie.F.toObject(userStateTrie.root);
		//create a poseidon hash of the paymentAmount and userNonce
		//@dev: note that userNonce is incremented by 1.
		const paymenAndNonceHash = poseidon([paymentAmount, userOldTxNonce + 1]);

		//console.log("newTxHash", poseidon.F.toObject(paymenAndNonceHash));
		// update the user Trie with the new paymentAndNonceHash
		const res = await userStateTrie.update(
			userID,
			poseidon.F.toObject(paymenAndNonceHash),
		);
		const newRoot = userStateTrie.F.toObject(userStateTrie.root);
		console.log("newRoot", newRoot);
		const siblings = convertSiblings(res.siblings);

		const inputs = {
			userID,
			views,
			secret,
			paymentAmount,
			userOldTxNonce,
			oldTxHash,
			siblings,
			oldRoot,
		};

		return { inputs, newHash: poseidon.F.toObject(paymenAndNonceHash) };
	};

	before(async () => {
		poseidon = await buildPoseidon();
		userStateTrie = await newMemEmptyTrie();

		PaymentAmountVerifier = await wasm(
			path.join(__dirname, "circuits", "/payment-amount-verify-test.circom"),
		);
		PaymentProcessor = await wasm(
			path.join(__dirname, "circuits", "/payment-amount-verify-test.circom"),
		);

		// Create few users with IDs like 1, 2, 3, 4, 5
		userIDs = [0, 1, 2, 3, 4, 5];
	});

	// Initiate the userStateTrie with the initial balance "0" for all the users.
	//@dev: User State Trie keys are userIDs(0,1,2,3,4) and values are balance.
	it("should initiate userStateTrie with 0 balance", async () => {
		for (let i = 0; i < userIDs.length; i++) {
			const zeroHash = poseidon.F.toObject(poseidon([0, 0]));

			await userStateTrie.insert(userIDs[i], zeroHash);
			oldTxHashMapping[userIDs[i]] = zeroHash;
			userNonceMapping[userIDs[i]] = 0;
		}
	});

	it("Should calculate the payment amount", async () => {
		const views = 100000;
		const secret = 1;
		const paymentAmount = calculatePaymentAmount(views, secret);
		assert.equal(paymentAmount, 100);
		const inputs = {
			views,
			secret,
		};
		console.log("input", inputs);
		const { proof, publicSignals } = await snarkjs.groth16.fullProve(
			inputs,
			"./build/payment-amount-verify-test_js/payment-amount-verify-test.wasm",
			"./build/payment-amount-verify-test.zkey",
		);
		//console.log("publicSignals", publicSignals);
		//console.log("proof", proof);
		const vKey = JSON.parse(
			fs
				.readFileSync("./build/payment-amount-verify-test_vkey.json")
				.toString(),
		);
		const res = await snarkjs.groth16.verify(
			vKey,
			publicSignals,
			proof,
			logger,
		);
		assert(res, "Proof is not valid");
	});

	// Initiate user Payment Transaction
	//@dev: Admin will initiate the payment transaction by providing user's userID, views and secret.
	it("should initiate payment transaction", async () => {
		const userID = 1;
		const views = 100000;
		const secret = 1;
		const userOldTxNonce = userNonceMapping[userID];
		const oldTxHash = oldTxHashMapping[userID];
		const { inputs, newHash } = await createPaymentTransferRequest(
			userID,
			views,
			secret,
			userOldTxNonce,
			oldTxHash,
		);
		// console.log("inputs", inputs);
		const { proof, publicSignals } = await snarkjs.groth16.fullProve(
			inputs,
			"./build/payment-processer-test_js/payment-processer-test.wasm",
			"./build/payment-processer-test.zkey",
		);
		//console.log("publicSignals", publicSignals);
		// console.log("proof", proof);
		const vKey = JSON.parse(
			fs.readFileSync("./build/payment-processer-test_vkey.json").toString(),
		);
		const res = await snarkjs.groth16.verify(
			vKey,
			publicSignals,
			proof,
			logger,
		);
		assert(res, "Proof is not valid");
		oldTxHashMapping[userID] = newHash;
		userNonceMapping[userID] = userOldTxNonce + 1;
	});

	it("Tests multiple payment txns", async () => {
		// Genarate bulk payments and store proof data in a local text file.
		const userID = 1;

		const userPayment = [
			{ views: 100000, secret: 1 },
			{ views: 200000, secret: 2 },
			{ views: 300000, secret: 3 },
			{ views: 400000, secret: 4 },
		];

		for (let i = 0; i < userPayment.length; i++) {
			const views = userPayment[i].views;
			const secret = userPayment[i].secret;
			const userOldTxNonce = userNonceMapping[userID];
			const oldTxHash = oldTxHashMapping[userID];
			console.log("oldTxHash", oldTxHash);
			console.log("nonce", userOldTxNonce);
			const { inputs, newHash } = await createPaymentTransferRequest(
				userID,
				views,
				secret,
				userOldTxNonce,
				oldTxHash,
			);
			console.log("inputs", inputs);
			const { proof, publicSignals } = await snarkjs.groth16.fullProve(
				inputs,
				"./build/payment-processer-test_js/payment-processer-test.wasm",
				"./build/payment-processer-test.zkey",
			);
			// console.log("publicSignals", publicSignals);
			// console.log("proof", proof);
			const vKey = JSON.parse(
				fs.readFileSync("./build/payment-processer-test_vkey.json").toString(),
			);
			const res = await snarkjs.groth16.verify(
				vKey,
				publicSignals,
				proof,
				logger,
			);
			assert(res, "Proof is not valid");
			oldTxHashMapping[userID] = newHash;
			userNonceMapping[userID] = userOldTxNonce + 1;

			//= poseidon.F.toObject(publicSignals[0]);
		}
	});
});

/* INPUT = {
  "userID": 1,
  "views": 100000,
  "secret": 1,
  "userOldTxNonce": 0,
  "paymentAmount": 100,
  "oldTxHash": 14744269619966411208579211824598458697587494354926760081771325075741142829156,
  "siblings": [
    8793755720050879226771079550273920346575490519485480360057320776748751995312,
    4614562799285771622253692789299102286469136375176734148219233637572331251713,
    8737693575479231375633156777717223879191424190632813711879081608418606336178,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  "oldRoot": 8737693575479231375633156777717223879191424190632813711879081608418606336178,
  "newRoot": 10788938711510615560157397621108027764395491374337063858146968106623400911200
// } */
