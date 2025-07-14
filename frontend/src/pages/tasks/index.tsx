import {
  Grid,
  Container,
  Box,
} from '@mui/material';
import TaskSearch from './TaskSearch';

function DashboardTasks() {
  return (
    <Container maxWidth="lg">
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="stretch"
        spacing={0}
      >
        <Grid item xs={12}>
          <Box p={4}>
            <TaskSearch />
          </Box>
        </Grid>
      </Grid>

    </Container>
  );
}

export default DashboardTasks;
