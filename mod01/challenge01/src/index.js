const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {

  let username = request.body.username;

  if (!username)
    username = request.params.username;

  if (!username)
    return response.status(400).json({ error: "Username can't be empty!" }).send();

  if (users.findIndex(u => u.username === username) === -1)
    return response.status(400).json({ error: "Username not found!" }).send();

  return next();
}

function checksAlreadyExists(request, response, next) {

  if (users.findIndex(u => u.username === request.body.username) !== -1)
    return response.status(400).json({ error: "Username already exists!" }).send();

  return next();
}

function checksUsernameField(request, response, next) {

  let username = request.body.username;

  if (!username)
    username = request.params.username;

  if (!username)
    return response.status(400).json({ error: "Username can't be empty!" }).send();

  return next();
}

function checksNameField(request, response, next) {

  const user = request.body;

  if (!user.name)
    return response.status(400).json({ error: "Name can't be empty!" }).send();

  return next();
}

app.get('/', (request, response) => {
  return response.json("I'm listening!").send();
});

app.post('/users',
  checksAlreadyExists,
  checksNameField,
  (request, response) => {
    const user = {
      id: uuidv4(),
      name: request.body.name,
      username: request.body.username,
      todos: []
    }
    users.push(user);
    return response.status(201).send();
  });

app.get('/users', (request, response) => {
  return response.json(users).send();
});

app.get('/todos/username/:username',
  checksUsernameField,
  (request, response) => {
    const user = users.find(u => u.username === request.params.username);
    if (!user)
      return response.status(404).json({ error: "User not found" }).send();
    return response.json(user.todos).send();
  });

app.post('/todos/username/:username',
  checksExistsUserAccount,
  (request, response) => {
    let user = users.find(u => u.username === request.params.username);

    console.log(user); // TODO remove

    user.todos.push({
      id: uuidv4(),
      title: request.body.title,
      done: false,
      deadline: new Date(request.body.deadline),
      created_at: new Date()
    });
    return response.status(201).send();
  });

app.put('/todos/username/:username/todoId/:id',
  checksExistsUserAccount,
  (request, response) => {

    const reqUsername = request.params.username;
    const reqTodoId = request.params.id;
    const reqTodoTitle = request.body.title;
    const reqTodoDeadline = request.body.deadline;

    const user = users.find(u => u.username === reqUsername);
    let todo = user.todos.find(t => t.id === reqTodoId);

    if (!todo)
      return response.status(404).json({ error: "Todo not found." }).send();

    if (!!reqTodoTitle)
      todo.title = reqTodoTitle;

    if (!!reqTodoDeadline)
      todo.deadline = reqTodoDeadline;

    return response.json(todo).send();
  });

app.patch('/todos/username/:username/todoId/:id/done',
  checksExistsUserAccount,
  (request, response) => {

    const reqUsername = request.params.username;
    const reqTodoId = request.params.id;

    const user = users.find(u => u.username === reqUsername);
    let todo = user.todos.find(t => t.id === reqTodoId);

    if (!todo)
      return response.status(404).json({ error: "Todo not found." }).send();

    todo.done = true;

    return response.json(todo).send();
  });

app.delete('/todos/username/:username/todoId/:id/', checksExistsUserAccount, (request, response) => {

  const reqUsername = request.params.username;
  const reqTodoId = request.params.id;

  const user = users.find(u => u.username === reqUsername);
  const todos = user.todos.filter(t => t.id !== reqTodoId);

  if (!todos.find(t => t.id !== reqTodoId))
    return response.status(400).json({ error: "Todo not found." }).send();

  user.todos = todos;

  return response.status(200).send();
});

module.exports = app;