import React, {useState,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import FavoriteIcon from '@mui/icons-material/Favorite';
import {useLogin} from '../../context/IsLoggedIn'
import AlertDialogue from './AlertDialogue'
import {useTheme} from '../../context/Theme'
import {usePriorityDisplay} from '../../context/PriorityDisplay'
import {scrollIntoView} from '../../utils/scrollIntoView'

function LikeProperty({data, size, margin}) {
    const { 
        alertClose,
        setMessage,
        setAlertOpen,
        setAlertClose,  
    } = useTheme();
    const navigate = useNavigate();
    const { isLoggedIn, userData } = useLogin();
    const {setPriorityDisplay} = usePriorityDisplay();
    const [likes, setLikes] = useState(data.likes); 
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        if(!userData?.user_id) return;
        fetch(`https://api.linknamali.ke/property/getuserlikestatus/${data.id}/${userData.user_id}`)
            .then((res) => res.json())
            .then((result) => {
                if (result.liked) {
                    setIsLiked(true);
                }
            })
            .catch((error) => console.error("Error fetching like status:", error));
    }, [data.id, userData?.user_id, isLoggedIn]);

    const toggleLike = (event) => {
        event.stopPropagation();
        if(!userData?.user_id){
            setMessage(`Log in to proceed. If you don’t have an account, Sign Up to get started.`)
            setAlertOpen(true);
            return;
        }
        fetch(
            `https://api.linknamali.ke/property/toggle_like/${data.id}/${userData.user_id}/${data.property_type}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            }
        )
            .then((res) => res.json())
            .then((result) => {
                if (result.liked) {
                    setLikes((prevLikes) => prevLikes + 1);
                } else {
                    // Prevent negative likes
                    setLikes((prevLikes) => Math.max(0, prevLikes - 1));
                }
                setIsLiked(result.liked);
            })
            .catch((error) => console.error("Error toggling like:", error));
    };

    useEffect(() => {
        setLikes(data.likes);
    }, [data]);

    useEffect(() => {
        if(alertClose){
            navigate(`/login`);
            setPriorityDisplay('login');
            scrollIntoView('login');
            setAlertClose(false);
        }
    }, [alertClose]);

    return(
        <>
            <AlertDialogue requestExit={true}/>
            <div className={`relative w-[25px] flex justify-center `}
            style={{marginRight: `${margin}px`}}
            >
                <FavoriteIcon
                onClick={(event) => toggleLike(event)}
                style={{
                    fontSize: size,
                    color: isLiked ? "red" : "gray",
                }}
                />
                {likes > 0 && (
                <span className="absolute top-[-10px] right-[-10px] bg-red-500 text-white text-xs rounded-full px-[5px]">
                    {likes}
                </span>
                )}
            </div>
        </>
    );
}

export default LikeProperty;
