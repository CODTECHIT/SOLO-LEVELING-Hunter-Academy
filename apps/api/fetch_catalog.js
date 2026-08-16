fetch('http://localhost:3001/courses/catalog')
  .then(res => res.json())
  .then(data => {
    const course = data.courses.find(c => c.title === 'Introduction to Python' || c.slug.includes('python'));
    console.log(JSON.stringify(course, null, 2));
  })
  .catch(console.error);
