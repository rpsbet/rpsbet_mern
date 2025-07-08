// Test online status functionality
const { BetSimulator } = require('./helper/util/betSimulationCron');

// Mock io with event capture
const mockEvents = [];
const mockIO = {
  sockets: {
    emit: (event, data) => {
      mockEvents.push({ event, data });
      console.log(`📡 Event: ${event}, Users: ${data.user_list ? data.user_list.length : 'N/A'}`);
    }
  }
};

// Mock users
const mockUsers = [
  { _id: '507f1f77bcf86cd799439011', username: 'user1' },
  { _id: '507f1f77bcf86cd799439012', username: 'user2' },
  { _id: '507f1f77bcf86cd799439013', username: 'user3' }
];

async function testOnlineStatus() {
  console.log('🧪 Testing online status system...');
  
  const simulator = new BetSimulator(mockIO);
  
  console.log('\n1. Setting users online...');
  for (const user of mockUsers) {
    await simulator.setUserOnline(user);
  }
  
  console.log(`\n2. Simulated online users: ${simulator.simulatedOnlineUsers.size}`);
  console.log('Users:', [...simulator.simulatedOnlineUsers]);
  
  console.log('\n3. Broadcasting online users...');
  simulator.broadcastOnlineUsers();
  
  console.log('\n4. Cleanup simulation...');
  simulator.cleanupSimulatedUsers();
  console.log(`After cleanup: ${simulator.simulatedOnlineUsers.size} users`);
  
  console.log('\n5. Events captured:');
  mockEvents.forEach((event, i) => {
    console.log(`${i+1}. ${event.event}: ${JSON.stringify(event.data)}`);
  });
  
  console.log('\n✅ Online status test completed');
}

// Mock the User model for testing
const User = {
  updateOne: async () => ({ acknowledged: true })
};

// Mock require to avoid database dependencies
const originalRequire = require;
require = function(moduleName) {
  if (moduleName === '../../model/User') {
    return User;
  }
  return originalRequire(moduleName);
};

testOnlineStatus().catch(console.error);