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

extern uint64_t entrypoint(const uint8_t *input)
{
  SolAccountInfo accounts[3];
  SolParameters params = (SolParameters){.ka = accounts};

  if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts)))
  {
    return ERROR_INVALID_ARGUMENT;
  }

  char instruction = params.data[0];
  char player = params.data[1];
  char field = params.data[2];
  uint8_t *data = params.ka[1].data;

  switch (instruction)
  {
  case 0:
    sol_log("Init");

    data[0] = 0;
    for (int i = 1; i <= 9; i++)
    {
      data[i] = 2;
      // *(uint8_t *)(data) = 0;
    }

  case 1:
    sol_log("Play");

    if (data[0] % 2 != player)
      return ERROR_INVALID_ARGUMENT;

    if (field > 0 && field < 10 && data[field] == 2)
      return ERROR_INVALID_ARGUMENT;

    data[0]++;
    data[field] = player;

    return SUCCESS;

  default:
    sol_log("Instruction not recognized");
    return ERROR_INVALID_ARGUMENT;
    break;
  }

  return SUCCESS;
}