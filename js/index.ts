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
const program = new PublicKey("7M69xk668NXsovVzCkaViwmd6sxc5Tch6djAky4a6JAX")
const game = Keypair.generate()

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
				{ pubkey: game.publicKey, isSigner: true, isWritable: true },
			],
			programId: program,
			data,
		})
	)

	console.log("Sending transaction...")

	let sig
	try {
		sig = await sendAndConfirmTransaction(connection, tx, [keypair, game], {
			// skipPreflight: true,
		})
		const fetchedAccount = await connection.getAccountInfo(game.publicKey)
		if (fetchedAccount != null) {
			console.log("Account exists")
			console.log("Account data:", fetchedAccount.data.toString())
		}
	} catch (error) {
		console.error(error)
	}
	console.log(`player ${player} tx: ${sig}`)
}

const main = async () => {
	const fetchedProgram = await connection.getAccountInfo(program)

	if (fetchedProgram != null) {
		console.log("Program exists")
	}

	console.log("Using keypair:", keypair.publicKey.toBase58())

	let tx = new Transaction({
		feePayer: keypair.publicKey,
	})

	tx.add(
		SystemProgram.createAccount({
			fromPubkey: keypair.publicKey,
			newAccountPubkey: game.publicKey,
			space: 10,
			lamports: await connection.getMinimumBalanceForRentExemption(10),
			programId: program,
		})
	)

	let layout = struct([u8("instruction"), u8("player"), u8("field")] as any[])
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
				{ pubkey: keypair.publicKey, isSigner: true, isWritable: true },
				{ pubkey: game.publicKey, isSigner: true, isWritable: true },
			],
			programId: program,
			data,
		})
	)

	console.log("Sending transaction...")

	let sig
	try {
		sig = await sendAndConfirmTransaction(connection, tx, [keypair, game], {
			// skipPreflight: true,
		})
	} catch (error) {
		console.error(error)
	}
	console.log("Transaction signature:", sig)

	console.log("Fetching account info...")
	const fetchedAccount = await connection.getAccountInfo(game.publicKey)
	if (fetchedAccount != null) {
		console.log("Account exists")
		console.log("Account data:", fetchedAccount.data.toString("hex"))
	}

	const sleep = (ms: number) =>
		new Promise(resolve => setTimeout(resolve, ms))
	await sleep(1000)

	await turn(0, 2)
	await turn(1, 1)
	await turn(0, 5)
	await turn(1, 7)
	await turn(0, 8)

	console.log("Fetching account info...")

	let fetchedAccount2
	while (fetchedAccount2 == null)
		fetchedAccount2 = await connection.getAccountInfo(game.publicKey)

	console.log("Account exists")
	console.log("Account data:", fetchedAccount2.data.toString("hex"))
}

main()
