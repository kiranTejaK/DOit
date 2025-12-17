import { Container } from "@chakra-ui/react"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/workspaces")({
  component: WorkspacesLayout,
})

function WorkspacesLayout() {
  return (
    <Container maxW="full">
      <Outlet />
    </Container>
  )
}
