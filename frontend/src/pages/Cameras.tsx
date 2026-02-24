import { useEffect, useState, type FormEvent } from 'react'
import Button from '../components/Button'

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

type NewCameraForm = {
  deviceName: string
  position: CameraPosition
}

function Cameras({ cameras }: CamerasProps) {
  const [cameraRows, setCameraRows] = useState<Camera[]>(cameras)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newCameraForm, setNewCameraForm] = useState<NewCameraForm>({
    deviceName: '',
    position: 'CheckIn',
  })

  useEffect(() => {
    setCameraRows(cameras)
  }, [cameras])

  const handleCreateCamera = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newCameraForm.deviceName.trim()) {
      setCreateError('Device name is required.')
      return
    }

    const now = new Date().toISOString()
    const nextId =
      cameraRows.length > 0 ? Math.max(...cameraRows.map((camera) => camera.id)) + 1 : Date.now()

    setCameraRows((existingRows) => [
      {
        id: nextId,
        deviceName: newCameraForm.deviceName.trim(),
        position: newCameraForm.position,
        status: 'Online',
        createdAt: now,
        updatedAt: now,
      },
      ...existingRows,
    ])

    setIsCreateModalOpen(false)
    setCreateError('')
    setNewCameraForm({ deviceName: '', position: 'CheckIn' })
  }

  return (
    <section className="cameras-page">
      <header className="cameras-header">
        <div>
          <h1>Cameras</h1>
          <p>Monitor camera endpoints and manage their assignment and status.</p>
        </div>
        <Button type="button" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          Add New Camera
        </Button>
      </header>

      <div className="cameras-grid">
        {cameraRows.map((camera) => (
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

      {isCreateModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add new camera">
          <div className="modal-card">
            <h2>Add New Camera</h2>
            <form className="camera-create-form" onSubmit={handleCreateCamera}>
              <label>
                Device name
                <input
                  type="text"
                  value={newCameraForm.deviceName}
                  onChange={(event) => {
                    setCreateError('')
                    setNewCameraForm((form) => ({ ...form, deviceName: event.target.value }))
                  }}
                />
              </label>

              <label>
                Position
                <select
                  value={newCameraForm.position}
                  onChange={(event) =>
                    setNewCameraForm((form) => ({ ...form, position: event.target.value as CameraPosition }))
                  }
                >
                  <option value="CheckIn">CheckIn</option>
                  <option value="CheckOut">CheckOut</option>
                </select>
              </label>

              {createError ? <p className="employee-form-error">{createError}</p> : null}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setCreateError('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn modal-btn-submit">
                  Create Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Cameras
