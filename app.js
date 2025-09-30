 // Simulated runtime config JSON (could be fetched from server)
    const config = {
      remotes: {
        reportingApp: {
          name: 'reportingApp',
          url: 'reportingApp', // logical name, no real URL since all in one file
          exposes: ['ReportDashboard']
        }
      }
    };

    // Simple event bus for cross-app communication
    const eventBus = {
      events: {},
      on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
      },
      emit(event, data) {
        (this.events[event] || []).forEach(fn => fn(data));
      }
    };

    // Shared session state (e.g., logged-in user with role)
    const sharedState = {
      user: { name: 'Admin User', role: 'admin' }, // example logged-in admin user
      setUser  (user) {
        this.user = user;
        eventBus.emit('userChanged', user);
      },
      getUser  () {
        return this.user;
      }
    };

    // Micro-frontend implementations (simulate remote modules)
    const microFrontends = {
      reportingApp: {
        ReportDashboard: function(container) {
          container.innerHTML = '';

          const user = sharedState.getUser ();

          const title = document.createElement('h2');
          title.textContent = 'Reporting App - Dashboard';

          container.appendChild(title);

          // Role-based access: only admin can see dashboard
          if (!user || user.role !== 'admin') {
            const msg = document.createElement('p');
            msg.className = 'text-danger';
            msg.textContent = 'Access denied. Admins only.';
            container.appendChild(msg);
            return;
          }

          // Create canvas for chart
          const canvas = document.createElement('canvas');
          canvas.id = 'reportChart';
          canvas.style.maxWidth = '600px';
          container.appendChild(canvas);

          // Sample data for chart
          const data = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June'],
            datasets: [{
              label: 'Sales',
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1,
              data: [65, 59, 80, 81, 56, 55],
            }]
          };

          // Chart config
          const configChart = {
            type: 'bar',
            data: data,
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          };

          // Render chart
          new Chart(canvas.getContext('2d'), configChart);

          // Update dashboard if user changes (e.g., role changes)
          eventBus.on('userChanged', (newUser ) => {
            if (!newUser  || newUser .role !== 'admin') {
              container.innerHTML = '';
              container.appendChild(title);
              const msg = document.createElement('p');
              msg.className = 'text-danger';
              msg.textContent = 'Access denied. Admins only.';
              container.appendChild(msg);
            }
          });
        }
      }
    };

    // Error Boundary simulation
    function renderWithErrorBoundary(renderFn, container, fallbackMessage) {
      try {
        renderFn(container);
        fallbackDiv.classList.add('d-none');
      } catch (e) {
        console.error('Error loading module:', e);
        fallbackDiv.textContent = fallbackMessage;
        fallbackDiv.classList.remove('d-none');
        container.innerHTML = '';
      }
    }

    // Navigation and routing simulation
    const nav = document.getElementById('nav');
    const appContainer = document.getElementById('app-container');
    const fallbackDiv = document.getElementById('fallback');

    // Current loaded module and component
    let currentModule = null;
    let currentComponent = null;

    // Build nav dynamically from config
    function buildNav() {
      nav.innerHTML = '';
      Object.entries(config.remotes).forEach(([moduleName, moduleInfo]) => {
        moduleInfo.exposes.forEach(componentName => {
          const li = document.createElement('li');
          li.className = 'nav-item';

          const a = document.createElement('a');
          a.className = 'nav-link';
          a.textContent = `${moduleName} - ${componentName}`;
          a.href = '#';
          a.onclick = (e) => {
            e.preventDefault();
            loadModuleComponent(moduleName, componentName);
            setActiveNav(a);
          };

          li.appendChild(a);
          nav.appendChild(li);
        });
      });
    }

    // Set active nav link styling
    function setActiveNav(activeLink) {
      Array.from(nav.querySelectorAll('a')).forEach(a => {
        a.classList.remove('active');
      });
      activeLink.classList.add('active');
    }

    // Load module component dynamically
    function loadModuleComponent(moduleName, componentName) {
      currentModule = moduleName;
      currentComponent = componentName;

      const module = microFrontends[moduleName];
      if (!module) {
        fallbackDiv.textContent = `${moduleName} module is currently unavailable.`;
        fallbackDiv.classList.remove('d-none');
        appContainer.innerHTML = '';
        return;
      }

      const component = module[componentName];
      if (!component) {
        fallbackDiv.textContent = `${componentName} component is currently unavailable in ${moduleName}.`;
        fallbackDiv.classList.remove('d-none');
        appContainer.innerHTML = '';
        return;
      }

      renderWithErrorBoundary(() => component(appContainer), appContainer, `${componentName} component failed to load.`);
    }

    // Initialize app
    function init() {
      buildNav();

      // Load first module/component by default
      const firstModule = Object.keys(config.remotes)[0];
      const firstComponent = config.remotes[firstModule].exposes[0];
      if (firstModule && firstComponent) {
        loadModuleComponent(firstModule, firstComponent);
        // Set active nav link
        const firstLink = nav.querySelector('a');
        if (firstLink) firstLink.classList.add('active');
      }
    }

    init();

    // Bonus: Dynamically add a new module at runtime (simulate adding without rebuild)
    /*
    setTimeout(() => {
      config.remotes.bookingApp = {
        name: 'bookingApp',
        url: 'bookingApp',
        exposes: ['BookingList', 'BookingForm']
      };

      microFrontends.bookingApp = {
        BookingList: function(container) {
          container.innerHTML = '<h2>Booking App - Booking List</h2><p>List of bookings here.</p>';
        },
        BookingForm: function(container) {
          container.innerHTML = '<h2>Booking App - Booking Form</h2><p>Booking form here.</p>';
        }
      };

      buildNav();
      alert('New module "bookingApp" added dynamically! Check navigation.');
    }, 5000);
    */