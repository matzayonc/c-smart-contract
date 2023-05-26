import {
	Connection,
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction,
	TransactionInstruction,
	sendAndConfirmTransaction,
} from "@solana/web3.js"
import { struct, u32, ns64, u8 } from "@solana/buffer-layout"
const readline = require("readline")
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

const connection = new Connection("https://api.devnet.solana.com")
const keypair = Keypair.fromSecretKey(
	new Uint8Array([
		175, 113, 217, 8, 160, 232, 167, 208, 204, 153, 226, 164, 234, 124, 252,
		147, 79, 209, 48, 193, 127, 164, 219, 155, 143, 91, 45, 17, 46, 221,
		148, 107, 116, 254, 1, 210, 231, 15, 65, 24, 239, 166, 111, 244, 148,
		187, 46, 130, 30, 131, 199, 76, 253, 206, 52, 164, 252, 26, 212, 144,
		231, 28, 18, 53,
	])
)
const program = new PublicKey("7e2vBfoSAbnJSFM1f67Nuq2KjESysShxQCmKUcHnWtGS")
const gameKeypair = Keypair.generate()
let gameId = gameKeypair.publicKey

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const turn = async (player: number, field: number) => {
	let tx = new Transaction()
	let layout = struct([u8("instruction"), u8("player"), u8("field")] as any[])
	let data = Buffer.alloc(layout.span)
	let layoutFields = Object.assign({ instruction: 1 }, { player }, { field })
	layout.encode(layoutFields, data)

	tx.add(
		new TransactionInstruction({
			keys: [
				{ pubkey: keypair.publicKey, isSigner: true, isWritable: true },
				{ pubkey: gameId, isSigner: false, isWritable: true },
			],
			programId: program,
			data,
		})
	)

	console.log("Sending transaction...")

	let sig
	let c = 3
	while (sig == null && c-- > 0)
		try {
			sig = await sendAndConfirmTransaction(connection, tx, [keypair], {
				// skipPreflight: true,
			})
			const fetchedAccount = await connection.getAccountInfo(gameId)
			if (fetchedAccount != null) {
				console.log("Account exists")
				console.log("Account data:", fetchedAccount.data.toString())
			}
		} catch (error) {
			console.error(error)
		}
	console.log(`player ${player} tx: ${sig}`)
	await sleep(1000)
}

const main = async (gameStr: string, player: string) => {
	gameId = gameStr ? new PublicKey(gameStr) : gameId
	const fetchedProgram = await connection.getAccountInfo(program)

	if (fetchedProgram != null) {
		console.log("Program exists")
	}

	console.log("Game ID: ", gameId)
	console.log("Using keypair:", keypair.publicKey.toBase58())

	let tx = new Transaction({
		feePayer: keypair.publicKey,
	})

	if (!gameStr) {
		tx.add(
			SystemProgram.createAccount({
				fromPubkey: keypair.publicKey,
				newAccountPubkey: gameKeypair.publicKey,
				space: 10,
				lamports: await connection.getMinimumBalanceForRentExemption(
					10
				),
				programId: program,
			})
		)

		let layout = struct([
			u8("instruction"),
			u8("player"),
			u8("field"),
		] as any[])
		let data = Buffer.alloc(layout.span)
		let layoutFields = Object.assign(
			{ instruction: 0 },
			{ player: 0 },
			{ field: 0 }
		)
		layout.encode(layoutFields, data)

		tx.add(
			new TransactionInstruction({
				keys: [
					{
						pubkey: keypair.publicKey,
						isSigner: true,
						isWritable: true,
					},
					{
						pubkey: gameKeypair.publicKey,
						isSigner: true,
						isWritable: true,
					},
				],
				programId: program,
				data,
			})
		)

		console.log("Sending transaction...")

		let sig
		try {
			sig = await sendAndConfirmTransaction(
				connection,
				tx,
				[keypair, gameKeypair],
				{
					// skipPreflight: true,
				}
			)
		} catch (error) {
			console.error(error)
		}
		console.log("Transaction signature:", sig)
	}
	console.log("Fetching account info...")
	let fetchedAccount3
	while (fetchedAccount3 == null)
		fetchedAccount3 = await connection.getAccountInfo(gameId)

	// console.log("Account exists")
	console.log("Account data:", fetchedAccount3.data.toString("hex"))

	rl.question("What is your move?", async (field: string) => {
		if (!field) return
		await turn(player == "X" ? 1 : 0, parseInt(field))

		console.log("Fetching account info...")

		main(gameId.toBase58(), player)
	})
}

rl.question("Enter GameID, empty for new game?", (name: string) => {
	main(name, name ? "O" : "X")
})
