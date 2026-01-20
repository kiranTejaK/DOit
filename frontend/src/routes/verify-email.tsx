
import { Container, Heading, Text, VStack, Spinner, Icon } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi"

import { type ApiError, LoginService } from "@/client"
import { Button } from "@/components/ui/button"
import { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

// @ts-ignore - Route will be generated
export const Route = createFileRoute("/verify-email")({
  component: VerifyEmail,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function VerifyEmail() {
  const { showSuccessToast } = useCustomToast()
  const navigate = useNavigate()
  
  const token = new URLSearchParams(window.location.search).get("token")

  const mutation = useMutation({
    mutationFn: (token: string) =>
      LoginService.verifyEmail({
        requestBody: { token },
      }),
    onSuccess: () => {
      showSuccessToast("Email verified successfully! You can now log in.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  useEffect(() => {
    if (token) {
      mutation.mutate(token)
    }
  }, [token]) // Run once when token changes (or on mount)

  if (!token) {
    return (
      <Container
        h="100vh"
        maxW="sm"
        alignItems="center"
        justifyContent="center"
        centerContent
      >
        <VStack gap={4}>
          <Heading size="xl" color="ui.main" textAlign="center">
            Invalid Link
          </Heading>
          <Text textAlign="center">
            The verification link is invalid or missing.
          </Text>
          <Button onClick={() => navigate({ to: "/login" })}>
            Go to Login
          </Button>
        </VStack>
      </Container>
    )
  }

  // Helper to safely extract error detail
  const getErrorDetail = (error: ApiError) => {
    try {
        const body = error.body as any;
        return body?.detail || "Something went wrong. The link might be expired or invalid.";
    } catch {
        return "Something went wrong.";
    }
  }

  return (
    <Container
      h="100vh"
      maxW="md"
      alignItems="center"
      justifyContent="center"
      centerContent
    >
      <VStack gap={6} textAlign="center">
        {mutation.isPending && (
          <>
            <Spinner size="xl" color="ui.main" />
            <Heading size="lg">Verifying your email...</Heading>
            <Text>Please wait while we activate your account.</Text>
          </>
        )}

        {mutation.isSuccess && (
          <>
            <Icon as={FiCheckCircle} w={16} h={16} color="green.500" />
            <Heading size="lg" color="green.600">
              Email Verified!
            </Heading>
            <Text>
              Your email has been successfully verified. You can now log in to your account.
            </Text>
            <Button onClick={() => navigate({ to: "/login" })} colorScheme="orange" mt={4}>
              Continue to Login
            </Button>
          </>
        )}

        {mutation.isError && (
          <>
             <Icon as={FiAlertCircle} w={16} h={16} color="red.500" />
            <Heading size="lg" color="red.600">
              Verification Failed
            </Heading>
            <Text>
                {getErrorDetail(mutation.error as ApiError)}
            </Text>
            <Button onClick={() => navigate({ to: "/login" })} variant="outline" mt={4}>
              Back to Login
            </Button>
          </>
        )}
      </VStack>
    </Container>
  )
}
