use named_lock::NamedLock;

pub struct AppMutex {
    _lock: NamedLock,
}

impl AppMutex {
    /// Try to acquire. Returns Ok(Some) if acquired, Ok(None) if already running.
    pub fn try_acquire(quiz_id: &str) -> Result<Option<Self>, String> {
        let lock_name = format!("QuizForge_Player_{}", quiz_id);
        let lock = NamedLock::create(&lock_name)
            .map_err(|e| format!("Mutex create failed: {}", e))?;
        match lock.try_lock() {
            Ok(guard) => {
                std::mem::forget(guard); // Hold until process exits
                Ok(Some(Self { _lock: lock }))
            }
            Err(_) => Ok(None),
        }
    }
}
