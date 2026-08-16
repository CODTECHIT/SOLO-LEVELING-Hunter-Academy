fetch('http://localhost:3001/courses/slug/python-for-data-science-machine-learning-masterclass-1786123466665')
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data.course.lessons, null, 2)))
  .catch(console.error);
