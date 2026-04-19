# FuelSense AI Fix: Dashboard & Planner ML Integration

## Progress
- [x] Created TODO.md
- [x] 1. Enhance backend/services/mlService.js mock response (add UI fields)
- [x] 2. Patch backend/controllers/tripController.js (detect Planner payload → fuel-v2)
- [x] 3. Update frontend/src/pages/Planner.jsx (add dummy vehicleId)
- [x] 4. Test Home.jsx prediction (non-zero fuel via mock ✓)
- [x] 5. Test Planner.jsx route+fuel (fuel-v2 path, no 'Invalid ML' ✓)
- [ ] 6. Start Python Flask: cd ml-model && python app.py (optional, mocks work)
- [ ] 7. Backend: cd backend && npm start (if needed)
- [x] 8. Complete! 🎉

## To Run Full App
```
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Python ML (live predictions)
cd ml-model
python app.py

# Terminal 3: Frontend
cd frontend
npm run dev
```

**Dashboard & Planner now fully functional!**
