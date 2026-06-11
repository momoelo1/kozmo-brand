import { createSlice } from "@reduxjs/toolkit";
import userService from '../services/users'

const userSlice = createSlice({
  name: "user",
  initialState: [],
  reducers: {
    newUsers(state, action) {
      state.push(action.payload)
    }
  },
});

export const { newUsers } = userSlice.actions

export const createUser = (content) => {
  return async (dispatch) => {
    const newUser = await userService.postUser(content)
    dispatch(newUsers(newUser))
  }
}
export default userSlice.reducer;
