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
const program = new PublicKey("8AnN79SiXHsQd4pmMg2VQUJk6766K6h2Ce6FjoNgzttX")

const allocateInstruction = async () => {
	const [state, bump] = PublicKey.findProgramAddressSync(
		[
			Buffer.from(
				new (require("util").TextEncoder)("utf-8").encode(
					"Hello C++ on blockchain"
				)
			),
		],
		program
	)

	let layout = struct([u8("bump"), u8("instruction"), u8("player")] as any[])
	let data = Buffer.alloc(layout.span)
	let layoutFields = Object.assign(
		{ bump },
		{ instruction: 99 },
		{ player: 0 }
	)
	layout.encode(layoutFields, data)

	return new TransactionInstruction({
		keys: [
			{
				pubkey: SystemProgram.programId,
				isSigner: false,
				isWritable: false,
			},
			{ pubkey: state, isSigner: false, isWritable: true },
			{ pubkey: keypair.publicKey, isSigner: true, isWritable: true },
		],
		programId: program,
		data,
	})
}

const main = async () => {
	const fetchedProgram = await connection.getAccountInfo(program)

	if (fetchedProgram != null) {
		console.log("Program exists")
	}

	console.log("Using keypair:", keypair.publicKey.toBase58())

	let allocateTransaction = new Transaction({
		feePayer: keypair.publicKey,
	})

	const [state, bump] = PublicKey.findProgramAddressSync(
		[
			Buffer.from(
				new (require("util").TextEncoder)("utf-8").encode(
					"Hello C++ on blockchain"
				)
			),
		],
		program
	)

	allocateTransaction.add(await allocateInstruction())

	console.log("Sending transaction...")

	let sig
	try {
		sig = await sendAndConfirmTransaction(
			connection,
			allocateTransaction,
			[keypair],
			{
				// skipPreflight: true,
			}
		)
	} catch (error) {
		console.error(error)
	}
	console.log("Transaction signature:", sig)
}

main()
