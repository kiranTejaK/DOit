import { Container } from "@chakra-ui/react"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/projects")({
  component: ProjectsLayout,
})

function ProjectsLayout() {
  return (
    <Container maxW="full">
      <Outlet />
    </Container>
  )
}
