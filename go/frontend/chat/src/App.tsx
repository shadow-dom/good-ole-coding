import { Router, Route } from '@solidjs/router';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Room from './pages/Room';

const App = () => {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/room/:id" component={Room} />
    </Router>
  );
};

export default App;
