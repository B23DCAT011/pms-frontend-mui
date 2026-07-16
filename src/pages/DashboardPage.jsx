import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import { listProjects } from '../api/projects.js'
import { listAllMyTasks } from '../api/tasks.js'
import { useAuth } from '../auth/AuthContext.jsx'
import RecentProjectsList from '../components/dashboard/RecentProjectsList.jsx'
import StatTiles from '../components/dashboard/StatTiles.jsx'
import TaskStatusDonut from '../components/dashboard/TaskStatusDonut.jsx'
import UpcomingTasksList from '../components/dashboard/UpcomingTasksList.jsx'

export default function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [projectCount, setProjectCount] = useState(0)
  const [tasks, setTasks] = useState([])
  const [onlyMine, setOnlyMine] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [projectsData, allTasks] = await Promise.all([
        listProjects(),
        listAllMyTasks(),
      ])
      setProjects(projectsData.results)
      setProjectCount(projectsData.count)
      setTasks(allTasks)
      setLoading(false)
    }
    load()
  }, [])

  const filteredTasks = useMemo(() => {
    if (!onlyMine) return tasks
    return tasks.filter((task) => task.assigned_to?.id === user.id)
  }, [tasks, onlyMine, user])

  const statusCounts = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 }
    for (const task of filteredTasks) counts[task.status.category] += 1
    return counts
  }, [filteredTasks])

  const { overdueTasks, upcomingTasks, overdueCount } = useMemo(() => {
    const now = new Date()
    const withDeadline = filteredTasks.filter((task) => task.deadline)
    const overdueAll = withDeadline
      .filter((task) => new Date(task.deadline) < now && task.status.category !== 'done')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    const upcoming = withDeadline
      .filter((task) => new Date(task.deadline) >= now)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    return { overdueTasks: overdueAll, upcomingTasks: upcoming, overdueCount: overdueAll.length }
  }, [filteredTasks])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <StatTiles projectCount={projectCount} taskCount={filteredTasks.length} overdueCount={overdueCount} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <FormControlLabel
          control={<Switch checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />}
          label="Chỉ task của tôi"
        />
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <RecentProjectsList projects={projects} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TaskStatusDonut statusCounts={statusCounts} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <UpcomingTasksList overdueTasks={overdueTasks} upcomingTasks={upcomingTasks} />
        </Grid>
      </Grid>
    </Box>
  )
}
