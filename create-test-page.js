// Simple test to verify time-based routing in browser console
console.log('🧪 Time-Based Routing Test');
console.log('Open browser console and paste this code:');
console.log(`
// Test time-based routing
const testTimes = [8, 12, 15, 18, 22, 2];
testTimes.forEach(hour => {
  console.log(\`⏰ Testing hour \${hour}:\`);
  const timeOfDay = hour >= 6 && hour < 14 ? 'morning' : 
                    hour >= 14 && hour < 22 ? 'evening' : 'morning';
  console.log(\`   Time of Day: \${timeOfDay}\`);
  console.log(\`   Direction: \${timeOfDay === 'evening' ? '🏫➡️🏠 Campus to Home' : '🏠➡️🏫 Home to Campus'}\`);
});
`);

// Also create a test page
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Time-Based Routing Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .result { background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .morning { border-left: 4px solid #4CAF50; }
        .evening { border-left: 4px solid #FF9800; }
    </style>
</head>
<body>
    <h1>🚌 Time-Based Routing System Test</h1>
    
    <div id="results"></div>
    
    <script>
        // Test time-based routing logic
        function getCurrentTimeOfDay(hour = null) {
            const testHour = hour || new Date().getHours();
            if (testHour >= 6 && testHour < 14) return 'morning';
            else if (testHour >= 14 && testHour < 22) return 'evening';
            else return 'morning';
        }
        
        function getRouteInfo(timeOfDay) {
            if (timeOfDay === 'evening') {
                return {
                    timeOfDay: 'evening',
                    route: 'MIET Campus to Home',
                    direction: '🏫➡️🏠 Campus to Home',
                    icon: '🌆',
                    stops: ['MIET Campus', 'rohta bypass', 'Meerut Cantt', 'modipuram']
                };
            } else {
                return {
                    timeOfDay: 'morning',
                    route: 'Home to MIET Campus',
                    direction: '🏠➡️🏫 Home to Campus',
                    icon: '🌅',
                    stops: ['modipuram', 'Meerut Cantt', 'rohta bypass', 'MIET Campus']
                };
            }
        }
        
        const resultsDiv = document.getElementById('results');
        const testHours = [8, 12, 15, 18, 22, 2];
        
        // Show current time test
        const currentTime = new Date();
        const currentTimeOfDay = getCurrentTimeOfDay();
        const currentRouteInfo = getRouteInfo(currentTimeOfDay);
        
        resultsDiv.innerHTML += \`
            <div class="result \${currentTimeOfDay}">
                <h3>🕐 Current Time: \${currentTime.toLocaleTimeString()}</h3>
                <p><strong>Time of Day:</strong> \${currentRouteInfo.timeOfDay}</p>
                <p><strong>Direction:</strong> \${currentRouteInfo.direction}</p>
                <p><strong>Route:</strong> \${currentRouteInfo.route}</p>
                <p><strong>Stops:</strong> \${currentRouteInfo.stops.join(' → ')}</p>
            </div>
        \`;
        
        // Test all hours
        testHours.forEach(hour => {
            const timeOfDay = getCurrentTimeOfDay(hour);
            const routeInfo = getRouteInfo(timeOfDay);
            
            resultsDiv.innerHTML += \`
                <div class="result \${timeOfDay}">
                    <h3>\${routeInfo.icon} \${hour}:00 - \${timeOfDay.toUpperCase()}</h3>
                    <p><strong>Direction:</strong> \${routeInfo.direction}</p>
                    <p><strong>Route:</strong> \${routeInfo.route}</p>
                    <p><strong>Stops:</strong> \${routeInfo.stops.join(' → ')}</p>
                </div>
            \`;
        });
        
        console.log('✅ Time-based routing test complete!');
    </script>
</body>
</html>
`;

require('fs').writeFileSync('time-based-routing-test.html', testHTML);
console.log('✅ Created time-based-routing-test.html');
console.log('📝 Open this file in a browser to test the time-based routing system!');
