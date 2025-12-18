import { 
  Box, 
  Container, 
  Text, 
  SimpleGrid, 
  Card, 
  Heading, 
  Stack, 
  Flex, 
  Badge,
  Icon, 
  Spinner
} from "@chakra-ui/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { FiBriefcase, FiCheckCircle, FiClock, FiList, FiCircle } from "react-icons/fi"

import { ProjectsService, TasksService, type TaskPublicWithProject, type ProjectPublic } from "@/client"
import useAuth from "@/hooks/useAuth"

interface ProjectPublicWithWorkspace extends ProjectPublic {
    workspace_name: string
}

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()

  // Fetch Projects
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectsService.readProjects({ limit: 100 }),
  })
  const projects = (projectsData?.data || []) as unknown as ProjectPublicWithWorkspace[]

  // Fetch Tasks
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", { assigneeId: user?.id }],
    queryFn: () => TasksService.readTasks({ assigneeId: user?.id, limit: 100 }),
    enabled: !!user?.id,
  })
  const tasks = (tasksData?.data || []) as unknown as TaskPublicWithProject[]

  // Calculate Stats
  const totalProjects = projects.length
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const pendingTasks = totalTasks - completedTasks

  // Recent Projects (last 3) - assuming simplistic sort by ID or just taking first 3 for MVP as backend doesn't sort by date yet
  // In a real app we'd want 'updated_at' sort. For now, slice 3.
  const recentProjects = projects.slice(0, 3)

  // Upcoming Tasks (first 5 pending)
  const upcomingTasks = tasks
    .filter(t => t.status !== 'done')
    .slice(0, 5)

  if (isLoadingProjects || isLoadingTasks) {
    return (
        <Container maxW="full" p={8}>
            <Spinner />
        </Container>
    )
  }

  const StatCard = ({ label, value, icon, color }: { label: string, value: number, icon: any, color: string }) => (
    <Card.Root variant="outline" bg="bg.sub" borderColor="border.main">
        <Card.Body>
            <Flex align="center" gap={4}>
                <Box p={3} rounded="full" bg={`${color}.100`} color={`${color}.600`} _dark={{ bg: `${color}.900`, color: `${color}.200` }}>
                    <Icon as={icon} boxSize={6} />
                </Box>
                <Box>
                    <Text fontSize="sm" color="fg.muted" fontWeight="medium">{label}</Text>
                    <Heading size="2xl">{value}</Heading>
                </Box>
            </Flex>
        </Card.Body>
    </Card.Root>
  )

  return (
    <Container maxW="full" p={{ base: 4, md: 8 }}>
      <Box mb={8}>
        <Heading size="2xl" mb={2}>
            Hi, {user?.full_name || user?.email?.split('@')[0]} 👋🏼
        </Heading>
        <Text fontSize="lg" color="fg.muted">Here's what's happening today.</Text>
      </Box>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={10}>
        <StatCard label="Total Projects" value={totalProjects} icon={FiBriefcase} color="blue" />
        <StatCard label="My Tasks" value={totalTasks} icon={FiList} color="purple" />
        <StatCard label="Pending" value={pendingTasks} icon={FiClock} color="orange" />
        <StatCard label="Completed" value={completedTasks} icon={FiCheckCircle} color="green" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
        {/* Recent Projects */}
        <Box>
            <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Recent Projects</Heading>
                <Link to="/projects" search={{ page: 1 }}>
                    <Text fontSize="sm" color="ui.main" fontWeight="bold">View All</Text>
                </Link>
            </Flex>
            <Stack gap={4}>
                {recentProjects.length === 0 ? <Text color="fg.muted">No projects yet.</Text> : null}
                {recentProjects.map(project => (
                    <Card.Root key={project.id} variant="outline" bg="bg.sub" borderColor="border.main" _hover={{ shadow: 'sm', borderColor: 'ui.main' }} transition="all 0.2s">
                        <Card.Body p={4}>
                            <Flex justify="space-between" align="center">
                                <Box>
                                    <Heading size="sm" mb={1}>{project.name}</Heading>
                                    <Text fontSize="xs" color="fg.muted">{project.workspace_name}</Text>
                                </Box>
                                <Icon as={FiBriefcase} color="gray.400" />
                            </Flex>
                        </Card.Body>
                    </Card.Root>
                ))}
            </Stack>
        </Box>

        {/* Upcoming Tasks */}
        <Box>
             <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Upcoming Tasks</Heading>
                <Link to="/tasks">
                    <Text fontSize="sm" color="ui.main" fontWeight="bold">View All</Text>
                </Link>
            </Flex>
             <Card.Root variant="outline" bg="bg.sub" borderColor="border.main">
                <Card.Body p={0}>
                    <Stack gap={0} divideY="1px" borderColor="border.main">
                         {upcomingTasks.length === 0 ? <Box p={4}><Text color="fg.muted">No pending tasks.</Text></Box> : null}
                         {upcomingTasks.map(task => (
                            <Flex key={task.id} p={4} align="center" gap={3} _hover={{ bg: "bg.muted" }}>
                                <Icon as={FiCircle} color="gray.400" />
                                <Box flex="1">
                                    <Text fontWeight="medium" lineClamp={1}>{task.title}</Text>
                                    <Flex gap={2} align="center" mt={1}>
                                         <Badge size="xs" variant="surface" colorPalette={task.priority === 'high' ? 'red' : 'gray'}>{task.priority}</Badge>
                                         <Text fontSize="xs" color="fg.muted">{task.project_name}</Text>
                                    </Flex>
                                </Box>
                                {task.due_date && <Text fontSize="xs" color="fg.muted">{new Date(task.due_date).toLocaleDateString()}</Text>}
                            </Flex>
                         ))}
                    </Stack>
                </Card.Body>
             </Card.Root>
        </Box>
      </SimpleGrid>

    </Container>
  )
}
