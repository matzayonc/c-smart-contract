/**
 * @brief A program demonstrating cross program invocations
 */
#include <solana_sdk.h>

extern uint64_t allocate(SolParameters *params, uint64_t size)
{

  // As part of the program specification the first account is the system
  // program's executable account and the second is the account to allocate
  if (params->ka_num < 2)
  {
    return ERROR_NOT_ENOUGH_ACCOUNT_KEYS;
  }
  SolAccountInfo *system_program_info = &params->ka[0];
  SolAccountInfo *allocated_info = &params->ka[1];

  // Hello C++ on blockchain
  uint8_t seed[] = {'H', 'e', 'l', 'l', 'o', ' ', 'C', '+', '+', ' ', 'o', 'n', ' ', 'b', 'l', 'o', 'c', 'k', 'c', 'h', 'a', 'i', 'n'};

  const SolSignerSeed seeds[] = {{seed, SOL_ARRAY_SIZE(seed)},
                                 {&params->data[0], 1}};
  const SolSignerSeeds signers_seeds[] = {{seeds, SOL_ARRAY_SIZE(seeds)}};

  SolPubkey expected_allocated_key;
  if (SUCCESS != sol_create_program_address(seeds, SOL_ARRAY_SIZE(seeds),
                                            params->program_id,
                                            &expected_allocated_key))
  {
    return ERROR_INVALID_INSTRUCTION_DATA;
  }
  if (!SolPubkey_same(&expected_allocated_key, allocated_info->key))
  {
    return ERROR_INVALID_ARGUMENT;
  }

  SolAccountMeta arguments[] = {{allocated_info->key, true, true}};
  uint8_t data[4 + 8];
  *(uint16_t *)data = 8;          // Instrukcja alokacji
  *(uint64_t *)(data + 4) = size; // Rozmiar do alokacji
  const SolInstruction instruction = {system_program_info->key, arguments,
                                      SOL_ARRAY_SIZE(arguments), data,
                                      SOL_ARRAY_SIZE(data)};
  return sol_invoke_signed(&instruction, params->ka, params->ka_num,
                           signers_seeds, SOL_ARRAY_SIZE(signers_seeds));
}

extern uint64_t transfer(SolParameters *params, int quantity)
{
  sol_log_params(params);

  // As part of the program specification the first account is the source
  // account and the second is the destination account
  if (params->ka_num < 3)
  {
    return ERROR_NOT_ENOUGH_ACCOUNT_KEYS;
  }
  SolAccountInfo *source_info = &params->ka[2];
  SolAccountInfo *destination_info = &params->ka[1];

  *source_info->lamports -= quantity;
  *destination_info->lamports += quantity;

  return SUCCESS;
}

extern uint64_t entrypoint(const uint8_t *input)
{
  SolAccountInfo accounts[3];
  SolParameters params = (SolParameters){.ka = accounts};

  if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts)))
  {
    return ERROR_INVALID_ARGUMENT;
  }

  if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts)))
  {
    return ERROR_INVALID_ARGUMENT;
  }

  // char instruction = params.data[0];
  // // sol_log(instruction);
  // while (instruction-- > 0)
  //   sol_log("Alokuje");

  // sol_log("Wczytałem wszystko");

  // if (allocate(&params, 42) != SUCCESS)
  //   return allocate(&params, 42);
  // sol_log("Pamięc zaalokowana");

  // if (transfer(&params, 10000) != SUCCESS)
  //   return transfer(&params, 10000);
  // sol_log("Lamporty przesłane");

  return SUCCESS;
}
