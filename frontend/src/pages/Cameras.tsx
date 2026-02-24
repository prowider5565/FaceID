type CameraStatus = 'Online' | 'Offline'
type CameraPosition = 'CheckIn' | 'CheckOut'

type Camera = {
  id: number
  deviceName: string
  position: CameraPosition
  status: CameraStatus
  createdAt: string
  updatedAt: string
}

type CamerasProps = {
  cameras: Camera[]
}

function Cameras({ cameras }: CamerasProps) {
  return (
    <section className="cameras-page">
      <header className="cameras-header">
        <div>
          <h1>Cameras</h1>
          <p>Monitor camera endpoints and manage their assignment and status.</p>
        </div>
      </header>

      <div className="cameras-grid">
        {cameras.map((camera) => (
          <article key={camera.id} className="camera-card">
            <div className="camera-card-head">
              <p className="camera-device">{camera.deviceName}</p>
              <span
                className={`camera-status${
                  camera.status === 'Online' ? ' camera-status-online' : ' camera-status-offline'
                }`}
              >
                {camera.status}
              </span>
            </div>

            <dl className="camera-meta-grid">
              <div>
                <dt>ID</dt>
                <dd>{camera.id}</dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>{camera.position}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(camera.createdAt).toLocaleString('en-US')}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{new Date(camera.updatedAt).toLocaleString('en-US')}</dd>
              </div>
            </dl>

            <div className="camera-card-actions">
              <button type="button" className="camera-btn camera-btn-edit">
                Edit
              </button>
              <button type="button" className="camera-btn camera-btn-delete">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Cameras
