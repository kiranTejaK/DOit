import {
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Box,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

import { ProjectsService, WorkspacesService } from "@/client"
import AddProject from "@/components/Projects/AddProject"

// @ts-ignore - Route path issues with variables but functionality is fine
export const Route = createFileRoute("/_layout/workspaces/$workspaceId")({
  component: WorkspaceDetails,
})

function WorkspaceDetails() {
  const { workspaceId } = Route.useParams() as any

  const { data: workspace, isLoading: isLoadingWorkspace } = useQuery({
    queryKey: ["workspaces", workspaceId],
    queryFn: () => WorkspacesService.readWorkspace({ id: workspaceId }),
  })

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", { workspaceId }],
    queryFn: () => ProjectsService.readProjects({ workspaceId, limit: 100 }),
  })

  // Fetch Members
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
      queryKey: ["workspaceMembers", workspaceId],
      queryFn: () => WorkspacesService.readWorkspaceMembers({ id: workspaceId }),
  })

  if (isLoadingWorkspace || isLoadingProjects) {
    return <Container p={4}>Loading...</Container>
  }

  if (!workspace) {
    return <Container p={4}>Workspace not found.</Container>
  }


  const projects = projectsData?.data || []
  
  const members = membersData?.data || []

  return (
    <Container maxW="full">
      <Flex justify="space-between" align="center" pt={12} pb={8}>
        <VStack align="start" gap={1}>
            <Heading size="lg">{workspace.name}</Heading>
            {workspace.description && (
                <Text color="gray.500">{workspace.description}</Text>
            )}
        </VStack>
        <AddProject />
      </Flex>

      <Heading size="md" mb={4}>Projects</Heading>

      {projects.length === 0 ? (
          <Box p={8} textAlign="center" bg="bg.muted" rounded="md" border="1px dashed" borderColor="border.main" mb={8}>
              <Text mb={4}>No projects in this workspace yet.</Text>
              <Text color="gray.500" fontSize="sm">Create a project to get started.</Text>
          </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6} mb={12}>
            {projects.map((project) => (
                <Link
                    key={project.id}
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    search={{ page: 1 }}
                    style={{ textDecoration: 'none' }}
                >
                    <Box
                        p={6}
                        bg="bg.sub"
                        rounded="lg"
                        shadow="sm"
                        border="1px solid"
                        borderColor="border.main"
                        _hover={{ shadow: "md", borderColor: "ui.main", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        h="full"
                    >
                        <Flex align="center" mb={3}>
                             <Box
                                as="span"
                                bg={project.color || "gray.200"}
                                w={3}
                                h={3}
                                rounded="full"
                                mr={3}
                             />
                             <Heading size="sm" lineClamp={1}>{project.name}</Heading>
                        </Flex>
                        <Text color="gray.600" fontSize="sm" lineClamp={3}>
                            {project.description || "No description"}
                        </Text>
                    </Box>
                </Link>
            ))}
        </SimpleGrid>
      )}
      
      <Heading size="md" mb={4}>Members</Heading>
      <Box overflowX="auto" bg="bg.sub" rounded="md" borderWidth="1px" mb={8}>
            {isLoadingMembers ? (
                <Box p={4}>Loading members...</Box>
            ) : members.length === 0 ? (
                <Box p={4}>No members found.</Box>
            ) : (
                <Box as="table" w="full" fontSize="sm">
                    <Box as="thead" bg="bg.muted" borderBottomWidth="1px">
                        <Box as="tr">
                            <Box as="th" p={3} textAlign="left" fontWeight="medium" color="gray.500">Name</Box>
                            <Box as="th" p={3} textAlign="left" fontWeight="medium" color="gray.500">Email</Box>
                            <Box as="th" p={3} textAlign="left" fontWeight="medium" color="gray.500">Role</Box>
                        </Box>
                    </Box>
                    <Box as="tbody" divideY="1px">
                        {members.map((member: any) => (
                            <Box as="tr" key={member.id} _hover={{ bg: "bg.muted" }}>
                                <Box as="td" p={3} fontWeight="medium">{member.full_name || "-"}</Box>
                                <Box as="td" p={3} color="gray.600">{member.email}</Box>
                                <Box as="td" p={3}>
                                    <Box 
                                        as="span" 
                                        px={2} 
                                        py={1} 
                                        rounded="full" 
                                        bg={member.role === 'owner' ? 'purple.100' : 'gray.100'} 
                                        color={member.role === 'owner' ? 'purple.700' : 'gray.700'}
                                        fontSize="xs"
                                        fontWeight="bold"
                                        textTransform="uppercase"
                                    >
                                        {member.role}
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
      </Box>

    </Container>
  )
}
