<?php
  class GetNickFromToken extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select nick
        from User where token = ?
      ');
      $st->execute([$args->token]);
      $row = $st->fetch();

      if($row === false){
        $this->err('data');
        return;
      }

      $this->succ($row['nick']);
    }
  }

  new GetNickFromToken();
?>