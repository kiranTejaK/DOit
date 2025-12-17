import {
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Spinner,
} from "@chakra-ui/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { InvitationsService } from "@/client"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

const acceptInviteSearchSchema = z.object({
  token: z.string(),
})

// @ts-ignore - Route not yet generated
export const Route = createFileRoute("/accept-invite")({
  component: AcceptInvite,
  validateSearch: (search) => acceptInviteSearchSchema.parse(search),
})

function AcceptInvite() {
  const { token } = Route.useSearch() as { token: string }
  const navigate = useNavigate()
  const { user: currentUser, isLoading: isAuthLoading } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => InvitationsService.getInvitation({ token }),
    retry: 1,
  })

  const acceptMutation = useMutation({
    mutationFn: () => InvitationsService.acceptInvitation({ token }),
    onSuccess: () => {
      showSuccessToast("You have successfully joined the workspace")
      navigate({ to: "/" })
    },
    onError: (err: any) => {
      const errorMessage = err.body?.detail || err.message || "An error occurred"
      showErrorToast(`Failed to join workspace: ${errorMessage}`)
    },
  })

  if (isLoading || isAuthLoading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    )
  }

  if (error || !invitation) {
    return (
      <Container maxW="md" py={12}>
        <VStack gap={6}>
          <Heading size="lg" color="red.500">Invalid or Expired Invitation</Heading>
          <Text>The invitation link is invalid or has expired.</Text>
          <Button asChild variant="outline">
            <Link to="/login">Go to Login</Link>
          </Button>
        </VStack>
      </Container>
    )
  }

  // If user is not logged in
  if (!currentUser) {
    return (
      <Container maxW="md" py={12}>
        <VStack gap={6} align="stretch" textAlign="center">
          <Heading size="lg">Join Workspace</Heading>
          <Text>
            You have been invited to join a workspace.
          </Text>
          <Text fontWeight="bold">
            Please Log In or Sign Up to accept this invitation.
          </Text>
          <Button asChild colorPalette="blue" size="lg">
             {/* Pass redirect params properly if login supports it */}
            <Link to="/login" search={{ redirect: `/accept-invite?token=${token}` }}>
              Log In
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </VStack>
      </Container>
    )
  }

  // User is logged in
  return (
    <Container maxW="md" py={12}>
      <VStack gap={6} align="stretch" textAlign="center">
        <Heading size="lg">You're Invited!</Heading>
        <Text>
          You are invited to join the workspace with your account <b>{currentUser.email}</b>.
        </Text>
        {invitation.email !== currentUser.email && (
             <Text color="orange.500" fontSize="sm">
                Warning: The invitation was sent to <b>{invitation.email}</b>, but you are logged in as <b>{currentUser.email}</b>.
                You can still accept it to link this workspace to your current account.
             </Text>
        )}
        
        <Button 
            size="xl" 
            colorPalette="teal" 
            onClick={() => acceptMutation.mutate()}
            loading={acceptMutation.isPending}
        >
          Accept & Join Workspace
        </Button>
        
        <Button asChild variant="ghost">
            <Link to="/">Cancel</Link>
        </Button>
      </VStack>
    </Container>
  )
}
