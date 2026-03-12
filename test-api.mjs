const testCreateHistory = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024年1月',
        title: '测试项目',
        role: '开发者',
        description: '这是一个测试项目'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
};

testCreateHistory();
