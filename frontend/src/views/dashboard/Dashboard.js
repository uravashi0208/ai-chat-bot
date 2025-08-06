import React from 'react'
import { Grid, Box } from '@mui/material'
import PageContainer from 'src/components/container/PageContainer'

// components
import ChatPage from './components/ChatPage'

const Dashboard = () => {
  return (
    <PageContainer title='Dashboard' description='this is Dashboard'>
      <Box>
        <Grid container spacing={3}>
          {/* <Grid item size={{ xs: 12 }}>
            <SalesOverview />
          </Grid>
          <Grid item size={{ xs: 12, lg: 4 }}>
            <RecentTransactions />
          </Grid> */}
          <Grid item size={{ xs: 12, lg: 12 }}>
            <ChatPage />
          </Grid>
          {/* <Grid item size={{ xs: 12 }}>
            <Blog />
          </Grid> */}
        </Grid>
      </Box>
    </PageContainer>
  )
}

export default Dashboard
