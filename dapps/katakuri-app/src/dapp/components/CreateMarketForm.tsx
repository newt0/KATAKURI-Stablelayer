import { FC, useState } from 'react'
import { Card, Flex, Text, TextField, Button } from '@radix-ui/themes'
import { buildCreateMarketTx } from '../helpers/transactions'
import useMarketAction from '../hooks/useMarketAction'
import { COIN_SYMBOL, COIN_DECIMALS } from '../config'
import { toCoinUnits } from '../utils'

const CreateMarketForm: FC = () => {
  const [question, setQuestion] = useState('')
  const [outcomes, setOutcomes] = useState(['', ''])
  const [fundAmount, setFundAmount] = useState('')
  const [feeBps, setFeeBps] = useState('100')
  const { execute, isPending } = useMarketAction()

  const addOutcome = () => {
    if (outcomes.length < 5) setOutcomes([...outcomes, ''])
  }

  const updateOutcome = (index: number, value: string) => {
    const updated = [...outcomes]
    updated[index] = value
    setOutcomes(updated)
  }

  const removeOutcome = (index: number) => {
    if (outcomes.length <= 2) return
    setOutcomes(outcomes.filter((_, i) => i !== index))
  }

  const handleCreate = () => {
    const validOutcomes = outcomes.filter((o) => o.trim() !== '')
    if (!question.trim() || validOutcomes.length < 2 || !fundAmount) return

    const fund = toCoinUnits(Number(fundAmount), COIN_DECIMALS)
    const tx = buildCreateMarketTx(
      question.trim(),
      validOutcomes,
      fund,
      Number(feeBps),
    )
    execute(tx)

    setQuestion('')
    setOutcomes(['', ''])
    setFundAmount('')
  }

  const isValid =
    question.trim() &&
    outcomes.filter((o) => o.trim()).length >= 2 &&
    Number(fundAmount) > 0

  return (
    <Card size="3" style={{ width: '100%' }}>
      <Flex direction="column" gap="3">
        <Text size="3" weight="bold">
          Create Market
        </Text>

        <Flex direction="column" gap="1">
          <Text size="2" color="gray">
            Question
          </Text>
          <TextField.Root
            placeholder="Who will win the fight?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text size="2" color="gray">
            Outcomes
          </Text>
          {outcomes.map((outcome, i) => (
            <Flex key={i} gap="2" align="center">
              <TextField.Root
                placeholder={`Outcome ${i + 1}`}
                value={outcome}
                onChange={(e) => updateOutcome(i, e.target.value)}
                style={{ flex: 1 }}
              />
              {outcomes.length > 2 && (
                <Button
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => removeOutcome(i)}
                  className="cursor-pointer"
                >
                  X
                </Button>
              )}
            </Flex>
          ))}
          {outcomes.length < 5 && (
            <Button
              size="1"
              variant="ghost"
              onClick={addOutcome}
              className="cursor-pointer"
            >
              + Add Outcome
            </Button>
          )}
        </Flex>

        <Flex gap="3">
          <Flex direction="column" gap="1" className="flex-1">
            <Text size="2" color="gray">
              Initial Fund ({COIN_SYMBOL})
            </Text>
            <TextField.Root
              placeholder="0.1"
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
            />
          </Flex>
          <Flex direction="column" gap="1" style={{ width: '120px' }}>
            <Text size="2" color="gray">
              Fee (bps)
            </Text>
            <TextField.Root
              placeholder="100"
              type="number"
              value={feeBps}
              onChange={(e) => setFeeBps(e.target.value)}
            />
          </Flex>
        </Flex>

        <Button
          size="3"
          color="blue"
          onClick={handleCreate}
          disabled={!isValid || isPending}
          className="cursor-pointer"
        >
          {isPending ? 'Creating...' : 'Create Market'}
        </Button>
      </Flex>
    </Card>
  )
}

export default CreateMarketForm
