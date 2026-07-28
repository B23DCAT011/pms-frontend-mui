import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

export default function ProjectCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="rounded" width={36} height={36} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" height={32} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="40%" sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" height={6} sx={{ mb: 1.5 }} />
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', mb: 1 }}>
          <Skeleton variant="circular" width={26} height={26} />
          <Skeleton variant="circular" width={26} height={26} />
        </Stack>
        <Skeleton variant="text" width="60%" />
      </CardContent>
    </Card>
  )
}
