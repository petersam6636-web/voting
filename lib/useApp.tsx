import {useContext} from 'react'
import {appContext} from "./appContext"
export default function useApp(){
    const context = useContext(appContext);
    if(!context) throw new Error('Context not found');
    return context
}