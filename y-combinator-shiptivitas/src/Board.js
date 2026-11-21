
import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';

import Swimlane from './Swimlane';
import './Board.css';

const API_URL = 'http://localhost:3001/api/v1/clients';

const STATUSES = {
  backlog: 'backlog',
  inProgress: 'in-progress',
  complete: 'complete',
};

export default class Board extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clients: {
        backlog: [],
        inProgress: [],
        complete: [],
      },
      loading: true,
      saving: false,
      error: null,
    };

    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    };

    this.drake = null;
    this.isMountedFlag = false;

    this.handleDrop = this.handleDrop.bind(this);
    this.fetchClients = this.fetchClients.bind(this);
  }

  componentDidMount() {
    this.isMountedFlag = true;

    // Initialize Dragula for all three swimlanes.
    const containers = [
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current,
    ];

    this.drake = Dragula(containers, {
      moves: () => !this.state.saving,
    });

    this.drake.on('drop', this.handleDrop);

    // Load stored clients from the backend.
    this.fetchClients();
  }

  componentWillUnmount() {
    this.isMountedFlag = false;

    if (this.drake) {
      this.drake.destroy();
      this.drake = null;
    }
  }

  // Convert an API response into three ordered lanes.
  groupClients(clients) {
    const grouped = {
      backlog: [],
      inProgress: [],
      complete: [],
    };

    clients.forEach(client => {
      if (client.status === STATUSES.backlog) {
        grouped.backlog.push(client);
      } else if (client.status === STATUSES.inProgress) {
        grouped.inProgress.push(client);
      } else if (client.status === STATUSES.complete) {
        grouped.complete.push(client);
      }
    });

    Object.keys(grouped).forEach(lane => {
      grouped[lane].sort(
        (a, b) => a.priority - b.priority || a.id - b.id
      );
    });

    return grouped;
  }

  // GET: Load saved card positions from SQLite.
  async fetchClients() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Failed to load shipping requests.');
      }

      const clients = await response.json();

      if (!this.isMountedFlag) return;

      this.setState({
        clients: this.groupClients(clients),
        loading: false,
        saving: false,
        error: null,
      });
    } catch (error) {
      if (!this.isMountedFlag) return;

      this.setState({
        loading: false,
        saving: false,
        error: error.message,
      });
    }
  }

  // Find the lane containing a specific DOM container.
  getLaneKey(container) {
    const keys = Object.keys(this.swimlanes);

    return keys.find(
      key => this.swimlanes[key].current === container
    );
  }

  // PUT: Save a card's new status and priority.
  async updateClient(id, status, priority) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        priority,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update card position.');
    }

    return response.json();
  }

  // Handle dragging within or between swimlanes.
  async handleDrop(element, target, source) {
    if (!target || !source) return;

    const targetLane = this.getLaneKey(target);

    if (!targetLane) return;

    const clientId = Number(element.dataset.id);

    const cards = Array.from(target.children);

    const targetIndex = cards.indexOf(element);

    if (targetIndex === -1) return;

    const newPriority = targetIndex + 1;
    const newStatus = STATUSES[targetLane];

    // Restore DOM ownership to React before updating state.
    if (this.drake) {
      this.drake.cancel(true);
    }

    this.setState({
      saving: true,
      error: null,
    });

    try {
      // Persist the change to the backend.
      const updatedClients = await this.updateClient(
        clientId,
        newStatus,
        newPriority
      );

      if (!this.isMountedFlag) return;

      // Render the confirmed state from the server.
      this.setState({
        clients: this.groupClients(updatedClients),
        saving: false,
        error: null,
      });
    } catch (error) {
      if (!this.isMountedFlag) return;

      this.setState({
        saving: false,
        error: error.message,
      });

      // Restore the latest saved server state.
      await this.fetchClients();
    }
  }

  renderSwimlane(name, clients, ref) {
    return (
      <Swimlane
        name={name}
        clients={clients}
        dragulaRef={ref}
      />
    );
  }

  render() {
    const {
      clients,
      loading,
      saving,
      error,
    } = this.state;

    return (
      <div className="Board">
        {loading && (
          <p>Loading shipping requests...</p>
        )}

        {saving && (
          <p>Saving card position...</p>
        )}

        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane(
                'Backlog',
                clients.backlog,
                this.swimlanes.backlog
              )}
            </div>

            <div className="col-md-4">
              {this.renderSwimlane(
                'In Progress',
                clients.inProgress,
                this.swimlanes.inProgress
              )}
            </div>

            <div className="col-md-4">
              {this.renderSwimlane(
                'Complete',
                clients.complete,
                this.swimlanes.complete
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
