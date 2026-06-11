import { createSlice } from '@reduxjs/toolkit'

const loggedUserSlice = createSlice({
    name: 'user',
    initialState: null,
    reducers: {
        setUser(state, action) {
            return action.payload
        },
        removeUser() {
            return null
        }
    }
})

export const { setUser, removeUser } = loggedUserSlice.actions
export default loggedUserSlice.reducer