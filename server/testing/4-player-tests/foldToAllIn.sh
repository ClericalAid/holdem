#!/bin/bash

sleep 10 > myPipe &
sleep 1
echo "raise 50" > myPipe; sleep 0.1
echo "raise 100" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "board" > myPipe; sleep 0.1
echo "moves" > myPipe; sleep 0.1
