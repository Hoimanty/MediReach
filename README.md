 Emergency Healthcare Availability Network

An emergency healthcare support web application designed to help users quickly find nearby healthcare resources such as hospitals, ICU/CCU beds, ambulances, and blood availability.

## Project Overview

During an emergency, finding an available hospital, ambulance, ICU/CCU bed, or required blood group can be difficult and time-consuming. This project provides a simple web-based interface where users can search for available emergency healthcare services based on their needs and location.

> **Note:** This is a demonstration project using simulated data. The healthcare facilities, ambulance information, and blood stock data are not real-time.

## Features

* 🏥 Search for available hospitals and healthcare services
* 🚑 Locate nearby ambulances
* 🩸 Check blood group availability
* 🛏️ Search for ICU/CCU bed availability
* 📍 View hospitals and ambulances on a map
* 🔎 Search and filter healthcare resources
* 📏 Sort results based on distance and availability
* 📞 Quick access to emergency number 999
* 📱 Responsive interface for different screen sizes
* ♿ Accessibility support with semantic HTML and skip navigation

## Main Pages

| Page                   | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **Home**               | Starting point where users select the emergency service they need                    |
| **Search**             | Allows users to search for a specific healthcare service                             |
| **Results**            | Displays available healthcare resources with filtering, sorting, and map information |
| **Locator**            | Shows nearby hospitals and ambulances on a map                                       |
| **Blood Availability** | Allows users to search for available blood groups                                    |
| **About**              | Provides information about the project, usage instructions, and emergency contacts   |

## Technologies Used

* **HTML5** — Page structure and semantic elements
* **CSS3** — Styling and responsive design
* **JavaScript** — Dynamic content, search, filtering, and page functionality
* **Bootstrap 5** — Responsive layout and UI components
* **Google Maps** — Map-based visualization of healthcare resources

## Project Structure

```text
EmergencyHealthcareNetwork/
│
├── index.html
├── about.html
├── blood.html
├── locator.html
├── results.html
├── search.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   ├── utils.js
│   ├── home.js
│   ├── search.js
│   ├── results.js
│   ├── blood.js
│   ├── locator.js
│   └── about.js
│
└── README.md
```

## How It Works

```text
User
  ↓
Selects Required Service
  ↓
Provides/Selects Location
  ↓
Searches Available Resources
  ↓
Results Are Filtered and Sorted
  ↓
User Views Nearby Healthcare Resources
  ↓
Call / Directions / Further Action
```

## HTML Structure

The HTML files provide the main structure of the application. Common elements such as:

* `<header>` for navigation
* `<main>` for primary content
* `<section>` for organizing content
* `<form>` for user input
* `<footer>` for footer information

are used throughout the project.

The common navigation and footer are dynamically inserted using JavaScript through elements such as:

```html
<header id="site-nav"></header>
```

and

```html
<footer id="site-footer"></footer>
```

Dynamic containers with IDs are also used so that JavaScript can insert search results, maps, blood availability, and other information.

## Emergency Contact

For emergencies in Bangladesh, users can call:

**999 — National Emergency Service**

## Disclaimer

This project is developed for educational and demonstration purposes. The hospital, ambulance, blood stock, and other healthcare information used in the application are simulated data and should not be considered real-time medical or emergency information.

## Purpose

The main purpose of this project is to demonstrate how a web-based emergency healthcare availability system can organize and present healthcare resources in an accessible and user-friendly way.
