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
		96, 215, 221, 190, 158, 190, 46, 187, 4, 149, 77, 74, 241, 36, 228, 57,
		180, 30, 248, 222, 81, 147, 16, 52, 142, 128, 198, 225, 78, 161, 240,
		170, 77, 179, 75, 249, 170, 79, 85, 114, 132, 229, 58, 124, 37, 214, 33,
		224, 21, 113, 152, 86, 118, 183, 86, 130, 213, 68, 65, 180, 4, 231, 190,
		28,
	])
)
const program = new PublicKey("Gdj6hXMoMKZwfTqrZGgGmXScmDdozrD5b8SgebGrbFT")
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
