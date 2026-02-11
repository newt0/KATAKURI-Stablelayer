import { FC, useState } from 'react'
import { Card, Flex, Text, Select, Button, Badge } from '@radix-ui/themes'
import useAdminCaps from '../hooks/useAdminCaps'
import useMarket from '../hooks/useMarket'
import { buildResolveTx } from '../helpers/transactions'
import useMarketAction from '../hooks/useMarketAction'

const ResolveMarketItem: FC<{ adminCapId: string; marketId: string }> = ({
  adminCapId,
  marketId,
}) => {
  const { data: market } = useMarket(marketId)
  const [winnerIndex, setWinnerIndex] = useState('0')
  const { execute, isPending } = useMarketAction()

  if (!market) return null
  if (market.resolved) {
    return (
      <Card variant="surface">
        <Flex justify="between" align="center">
          <Text size="2">{market.question}</Text>
          <Badge color="gray">
            Resolved: {market.outcomes[market.winner ?? 0]}
          </Badge>
        </Flex>
      </Card>
    )
  }

  const handleResolve = () => {
    const tx = buildResolveTx(adminCapId, marketId, Number(winnerIndex))
    execute(tx)
  }

  return (
    <Card variant="surface">
      <Flex direction="column" gap="2">
        <Text size="2" weight="bold">
          {market.question}
        </Text>
        <Flex gap="2" align="center">
          <Text size="2" color="gray">
            Winner:
          </Text>
          <Select.Root
            value={winnerIndex}
            onValueChange={(v) => setWinnerIndex(v)}
          >
            <Select.Trigger className="cursor-pointer" />
            <Select.Content>
              {market.outcomes.map((outcome, i) => (
                <Select.Item
                  key={i}
                  value={String(i)}
                  className="cursor-pointer"
                >
                  {outcome}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Button
            size="2"
            color="red"
            onClick={handleResolve}
            disabled={isPending}
            className="cursor-pointer"
          >
            Resolve
          </Button>
        </Flex>
      </Flex>
    </Card>
  )
}

const ResolveMarketForm: FC = () => {
  const { data: adminCaps } = useAdminCaps()

  if (!adminCaps || adminCaps.length === 0) {
    return (
      <Card size="3" style={{ width: '100%' }}>
        <Text size="2" color="gray">
          You don't have admin rights for any markets.
        </Text>
      </Card>
    )
  }

  return (
    <Card size="3" style={{ width: '100%' }}>
      <Flex direction="column" gap="3">
        <Text size="3" weight="bold">
          Your Markets
        </Text>
        {adminCaps.map((cap) => (
          <ResolveMarketItem
            key={cap.id}
            adminCapId={cap.id}
            marketId={cap.marketId}
          />
        ))}
      </Flex>
    </Card>
  )
}

export default ResolveMarketForm
