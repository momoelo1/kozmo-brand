import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
    name: 'notification',
    initialState: {
        message: '',
        type: null
    },
    reducers: {
        setMessage(state, action) {
            return {
                message: action.payload.message,
                type: action.payload.type
            }
        },
        removeMessage() {
            return {
                message: '',
                type: null
            }
        }
    }
})

export const { setMessage, removeMessage } = notificationSlice.actions

export const setNotification = (message, type) => {
    return (dispatch) => {
        dispatch(setMessage({message, type}))
        setTimeout(() => {
            dispatch(removeMessage())
        }, 10000)
    }
}

export default notificationSlice.reducer