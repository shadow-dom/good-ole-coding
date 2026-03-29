import { Router, Route } from '@solidjs/router';
import Home from './pages/Home';
import Rooms from './pages/Rooms';

const App = () => {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/rooms" component={Rooms} />
    </Router>
  );
};

export default App;
