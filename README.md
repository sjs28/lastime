# LasTime
A simple tool to track the last time you did something.

Created to fulfil a simple need to track things like haircuts, lawn mowing, filter changes. A clean, simple UI to track when you last did these things.

# AI Disclaimer
None of this code was written by AI. The basic project was pulled from a template of small PWA apps I build to use in my personal life. Some concepts in that template have been assisted by conversations with AI tools, but the code was written entirely by me. I also used AI for inspiration for the logo, which still looks awful anyway.

# Getting Started
The best way to run LasTime is in a docker container, behind a reverse proxy. Here is an example docker compose file to get started quickly:
To-Do

# Using LasTime
To use LasTime, simply navigate to your deployed instance in a browser. If you've deployed behind a reverse proxy with TLS enabled, you will be able to install the PWA if you'd like.

Once loaded, the interface should be quite intuitive. Simply click "Add Task" to create a new task to track. Give it a title, and (optionally) a description. Click save. You'll see the item appear as a card on the page, with "Never done" underneath it.

When you've done the task, simply click/tap on the card and click "Done It". This will log the current date as the "Last Done" date, and display it on the card. It will also track the history of all dates the task was done on, which will be used in future features to show trends.

If you want to change a title, description or last done date (if you actually did it a few days ago but only remembered to log it now for example), you can click "Edit" from within the card. Be sure to click "Save" when you're done editing, as clicking away from the modal will cancel the changes.

If you are done with a task for good (maybe you've gone bald and don't need to get haircuts any more?) you can archive a task by clicking "Archive" from within the card. This will change a background status flag to prevent it showing up in the task list any more, but retaining it in the database. Future releases could contain a mechanism to un-archive if users so desire.