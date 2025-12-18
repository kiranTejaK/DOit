import {
  Button,
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useState } from "react"
import { FiLayout, FiUserPlus } from "react-icons/fi"
import { z } from "zod"

import { WorkspacesService } from "@/client"
import AddWorkspace from "@/components/Workspaces/AddWorkspace"
import InviteMember from "@/components/Workspaces/InviteMember"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"

const workspacesSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getWorkspacesQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      WorkspacesService.readWorkspaces({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["workspaces", { page }],
  }
}

export const Route = createFileRoute("/_layout/workspaces/")({
  component: Workspaces,
  validateSearch: (search) => workspacesSearchSchema.parse(search),
})

function WorkspacesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getWorkspacesQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  // Pre-load current user to check permissions? API should handle it.

  const setPage = (page: number) => {
    navigate({
      to: "/workspaces",
      search: (prev) => ({ ...prev, page }),
    })
  }

  const handleInvite = (workspaceId: string) => {
      setInviteWorkspaceId(workspaceId)
      setIsInviteOpen(true)
  }

  const workspaces = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <Flex justify="center" align="center" h="200px">Loading...</Flex>
  }

  if (workspaces.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiLayout />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any workspaces yet</EmptyState.Title>
            <EmptyState.Description>
              Create a new workspace to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">Name</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
            <Table.ColumnHeader w="auto">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {workspaces.map((workspace) => (
            <Table.Row key={workspace.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="sm">
                {/* @ts-ignore */}
                <Link to="/workspaces/$workspaceId" params={{ workspaceId: workspace.id }}>
                    <ChakraLink as="span" color="orange.400" fontWeight="bold">
                        {workspace.name}
                    </ChakraLink>
                </Link>
              </Table.Cell>
              <Table.Cell
                color={!workspace.description ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {workspace.description || "N/A"}
              </Table.Cell>
               <Table.Cell>
                <Button size="xs" variant="outline" onClick={() => handleInvite(workspace.id)}>
                    <FiUserPlus /> Invite
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
      
      {inviteWorkspaceId && (
          <InviteMember 
            workspaceId={inviteWorkspaceId} 
            isOpen={isInviteOpen} 
            onOpenChange={({ open }) => setIsInviteOpen(open)} 
          />
      )}
    </>
  )
}

function Workspaces() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Workspaces Management
      </Heading>
      <AddWorkspace />
      <WorkspacesTable />
    </Container>
  )
}
